import React, { Component } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Linking, Alert, Platform, Modal, ActivityIndicator, Slider, Dimensions } from 'react-native';
import Constant from '../../helper/themeHelper';
import { wp, hp } from '../../helper/responsiveScreen';
import axios from 'axios';
import APIConstant from '../../api/apiConstant';
import { GiftedChat } from 'react-native-gifted-chat';
import { Bubble, ChatInputToolBar } from "../common/chatComponents";
import {encode_str_new_ver, decode_str_new_ver} from '../../helper/appHelper';
import { AppButton, BackView } from '../common';
import { OTSession } from 'opentok-react-native';

const screenWidth = Dimensions.get('window').width

class Chat extends Component {

    constructor(props) {
        super(props);
        this.state = {
            doctorId: (props.navigation.state && props.navigation.state.params) && props.navigation.state.params.doctorId,
            signal: {
                data: '',
                type: '',
            },
            text: '',
            apiKey: '',
            sessionId: '',
            token: '',
            messages: [],
            messageHistory: [],
            isConnected: false,
            connection: {},
            connectionData: {},
            loading: true,
            rate1: 2,
            rate2: 3,
            rate3: 1,
            rateModalVisibility: props.navigation.state.params.isRate != undefined && props.navigation.state.params.isRate || false
        };

        this.sessionOptions = {
            connectionEventsSuppressed: true, 
        };

        this.sessionEventHandlers = {
            signal: (event) => {
                if (event.data) {

                    let data = JSON.parse(event.data);
                    data = {
                        ...data,
                        text: decode_str_new_ver(data.text),
                        user: {
                            ...data.user,
                            avatar: data.user.avatar == '' ? 'default_user' : data.user.avatar
                        },
                    };
                    console.log("signal", JSON.stringify(data));
                    let filterMessage = this.setLastMessage(GiftedChat.append(this.state.messages, this.translate(data)));

                    this.setState(previousState => ({
                        messages: filterMessage
                    }));
                }
            },
            sessionConnected: event => {
                console.log("chat sessionConnected....", JSON.stringify(event));
                this.setState({
                    connection: event.connection,
                    connectionData: JSON.parse(event.connection.data),
                    isConnected: true,
                    loading: false
                })
            },
            sessionDisconnected: event => {
                console.log("chat sessionDisconnected....", event)
            },
            sessionReconnecting: event => {
                console.log("chat sessionReconnecting....", event)
            },
            sessionReconnected: event => {
                console.log("chat sessionReconnected....", event)
            },
            error: (error) => {
                console.log("////chat error....", error)
                this.reconnectSession();
            },
        };
    }

    reconnectSession = () => {
        this.setState({ loading: true })
        let sanitizedCredentials = {
            "apiKey": this.state.apiKey,
            "sessionId": this.state.sessionId,
            "token": this.state.token
        }
        this.session.createSession(sanitizedCredentials, this.sessionOptions)
    }

    componentWillMount() {
        const { userDetail } = this.props
        if (userDetail && userDetail.Token) {
            console.log('Token...', userDetail.Token)
            this.getInitialChatRoom(this.state.doctorId);
        } else {
            console.log('Token... You are logout')
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.navigation.state.params.doctorId !== this.props.navigation.state.params.doctorId) {
            this.props.navigation.replace('ChatScreen', { doctorId: nextProps.navigation.state.params.doctorId })
        }
    }

    translate = (message) => {
        if (message.text) {
            return { ...message, text: message.text }
        } else if (message.image) {
            return { ...message, image: message.image.uri }
        }
    };

    setLastMessage = (allMessages) => {
        allMessages.reverse();
        allMessages[0].last = true;
        for (let i = 0; i < allMessages.length - 1; i++) {
            let curr_msg = allMessages[i], next_msg = allMessages[i + 1];

            if (curr_msg.user && next_msg.user && (curr_msg.user._id === next_msg.user._id)) {
                delete curr_msg.last;
            }
            next_msg.last = true;
        }
        return allMessages.reverse()
    };

    getInitialChatRoom = (doctorId) => {
        const { userDetail, chatBaseURL } = this.props;
        this.getDoctorData(doctorId)
        this.getChatHistory(doctorId);

        console.log("room params", doctorId, userDetail.UserID);
        let reqHeader = ({ "Accept": "application/json", "Content-Type": "application/json" });
        let url = chatBaseURL+ 'room/' + 'doctor' + doctorId + '-user' + userDetail.UserID
        console.log("room url", url)
        axios.get(url, { headers: reqHeader })
            .then((response) => {
                console.log("room response", JSON.stringify(response.data));
                this.setState({
                    apiKey: response.data.apiKey,
                    sessionId: response.data.sessionId,
                    token: response.data.token
                });
                return response;
            })
            .catch((err) => {
                console.log("room error - ", err);
            });
    };

    getDoctorData = (doctorId) => {
        const { handleLocalAction, localActions, userDetail } = this.props;

        handleLocalAction({
            type: localActions.Get_Doctor_By_ID,
            data: {
                in_Token: userDetail.Token,
                in_DoctorID: doctorId
            }
        }).then(res => {
            if (res) {
                if (res.status === '200') {
                    console.log("doctor data..", JSON.stringify(res));
                    this.setState({
                        doctorData: res.data.result[0]
                    });
                } else {
                    alert(res.message);
                }
            }
        }).catch(e => {
            console.log(e);
        });
    }

    getChatHistory = (doctorId) => {
        const { handleLocalAction, localActions, userDetail } = this.props;
        handleLocalAction({
            type: localActions.GET_CHATS_BY_ROOM, data: {
                in_RoomName: 'doctor' + doctorId + '-user' + userDetail.UserID,
            }
        }).then(res => {
            if (res) {
                if (res.status === '200') {
                    let messageHistory = [];
                    let result = res.data.result;
                    for (let i = 0; i < result.length; i++) {
                        let str = result[i].MessageText;

                        let message = str.replace(/'/g, '"');
                        let messageObject = JSON.parse(message);
                        messageObject = {
                            ...messageObject,
                            text:decode_str_new_ver(messageObject.text),
                            user: {
                                ...messageObject.user,
                                _id: messageObject.user._id == doctorId ? 'doctor' + messageObject.user._id : 'user' + messageObject.user._id,
                                isSender: messageObject.user._id == doctorId ? false : true,
                                avatar: messageObject.user.avatar == '' ? 'default_user' : messageObject.user.avatar
                            },
                            last: i == result.length - 1 ? true : false
                        };
                        messageHistory.push(messageObject)
                    }
                    console.log("messageHistory : ", JSON.stringify(messageHistory[0]));
                    this.setState({
                        messages: messageHistory.reverse()
                    });

                } else {
                }
            }
        }).catch(e => {
            console.log(e);
        });
    };

    checkpermission = (messages) => {       
        this.sendSignal(messages)       
    };

    sendSignal = (messages) => {        
        let cipher = encode_str_new_ver(messages[0].text);
        const { handleLocalAction, navigation, localActions } = this.props;
        const { isConnected, connectionData, } = this.state;
        if (isConnected == true && messages[0].text != '') {
            let data = {
                userId: this.state.connectionData.user2,
                text_message: messages[0].text,
                _id: messages[0]._id,
                text: messages[0].text,
                createdAt: messages[0].createdAt,
                user: messages[0].user,
                last: true
            };
            this.session.signal({
                data: JSON.stringify(data),
                to: '',
                type: 'msg',
            });

            handleLocalAction({
                type: localActions.ADD_CHAT, data: {
                    in_RoomName: connectionData.room_name,
                    in_From: connectionData.user2,
                    in_To: connectionData.user1,
                    in_Message: cipher
                }
            }).then(res => {
                if (res) {
                    if (res.status === '200') {
                    } else {
                        if (res.message !== "Token is expired or doesnt exists" || res.message !== "Token invalid!") {
                            alert(res.message);
                        }
                    }
                }
            }).catch(e => {
                console.log(e);
            });
        }
    }

    renderBubble = (props) => {
        return (
            <Bubble {...props} />
        )
    }

    renderChatInputToolBar = (props) => {
        return (
            <ChatInputToolBar {...props}
                isVideoEnable={true}
                makeVideoCall={() => this.checkCallPermission()} />
        )
    };

    footerDemo = () => {
        return (
            <View style={{ height: hp(6) }} />
        )
    };

    _OTSession = () => {
        return (
            <OTSession
                apiKey={this.state.apiKey}
                sessionId={this.state.sessionId}
                token={this.state.token}
                signal={this.state.signal}
                eventHandlers={this.sessionEventHandlers}
                ref={(instance) => {
                    this.session = instance;
                }}
                options={this.sessionOptions} />
        )
    }

    makeVideoCall() {
        const { isConnected, doctorData, doctorId } = this.state;
        if (isConnected == true) {

            console.log("makeVideoCall", doctorId, JSON.stringify(doctorData))           
            this.props.navigation.replace('VideoCall', { from: 'chat', doctorId: doctorId, doctorNumber: doctorData.PhoneNumber })            
        }
    }

    sendWhatsAppMessage = () => {
        const { doctorData } = this.state;
        Linking.openURL(`whatsapp://send?&phone=${doctorData.PhoneNumber}`);
    }

    onRate = () => {
        this.setState({ rateModalVisibility: 'false' })
    }

    rateModal = () => {
        const { rateModalView, rateTitleText, rateSubTitleText, rateText } = styles;
        const { navigation } = this.props;
        const { appointmentID, rate1, rate2, rate3 } = this.state;
        const left1 = rate1 * (screenWidth - 60) / 15 - (rate1 * 3.5);
        const left2 = rate2 * (screenWidth - 60) / 15 - (rate2 * 3.5);
        const left3 = rate3 * (screenWidth - 60) / 15 - (rate3 * 3.5);
        return (
            <View style={rateModalView}>
                <TouchableOpacity style={{ position: 'absolute', top: hp(2), right: wp(5) }} onPress={() => this.setState({ rateModalVisibility: 'false' })}>
                    <Image style={{ height: hp(3), width: wp(6) }} resizeMode='contain' source={{ uri: 'close_icon' }}></Image>
                </TouchableOpacity>

                <View style={{ alignSelf: 'center' }}>
                    <Text style={rateTitleText}>{`Rate this call`}</Text>

                    <View>
                        <Text style={rateSubTitleText}>{`Attitude:`}</Text>
                        <View style={{
                            position: 'absolute', width: wp(7), paddingVertical: wp(1),
                            borderRadius: wp(2), left: left1, top: hp(6), alignItems: 'center',
                            justifyContent: 'center', backgroundColor: Constant.color.lightSky
                        }}>
                            <Text style={{ color: Constant.color.blue, fontSize: Constant.fontSize.mini }}>
                                {Math.floor(rate1)}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={rateText}>{`1`}</Text>
                            <Slider value={rate1}
                                style={{ flex: 1, marginHorizontal: wp(3) }}
                                minimumValue={1} maximumValue={10}
                                minimumTrackTintColor={Constant.color.lightSky}
                                maximumTrackTintColor={Constant.color.lightSky}
                                thumbTintColor={Constant.color.skyBlue}
                                onValueChange={value => this.setState({ rate1: value })} ></Slider>
                            <Text style={rateText}>{`10`}</Text>
                        </View>
                    </View>
                    <View>
                        <Text style={rateSubTitleText}>{`How likely are you to recommend the HP:`}</Text>
                        <View style={{
                            position: 'absolute', width: wp(7), paddingVertical: wp(1),
                            borderRadius: wp(2), left: left2, top: hp(6), alignItems: 'center',
                            justifyContent: 'center', backgroundColor: Constant.color.lightSky
                        }}>
                            <Text style={{ color: Constant.color.blue, fontSize: Constant.fontSize.mini }}>
                                {Math.floor(rate2)}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={rateText}>{`1`}</Text>
                            <Slider value={rate2}
                                style={{ flex: 1, marginHorizontal: wp(3) }}
                                minimumValue={1} maximumValue={10}
                                minimumTrackTintColor={Constant.color.lightSky}
                                maximumTrackTintColor={Constant.color.lightSky} thumbTintColor={Constant.color.skyBlue}
                                onValueChange={value => this.setState({ rate2: value })} ></Slider>
                            <Text style={rateText}>{`10`}</Text>
                        </View>
                    </View>

                    <View>
                        <Text style={rateSubTitleText}>{`Would you repeat the appointment with the\nsame HP:`}</Text>
                        <View style={{
                            position: 'absolute', width: wp(7), paddingVertical: wp(1),
                            borderRadius: wp(2), left: left3, top: hp(8), alignItems: 'center',
                            justifyContent: 'center', backgroundColor: Constant.color.lightSky
                        }}>
                            <Text style={{ color: Constant.color.blue, fontSize: Constant.fontSize.mini }}>
                                {Math.floor(rate3)}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={rateText}>{`1`}</Text>
                            <Slider value={rate3}
                                style={{ flex: 1, marginHorizontal: wp(3) }}
                                minimumValue={1} maximumValue={10}
                                minimumTrackTintColor={Constant.color.lightSky}
                                maximumTrackTintColor={Constant.color.lightSky}
                                thumbTintColor={Constant.color.skyBlue}
                                onValueChange={value => this.setState({ rate3: value })} ></Slider>
                            <Text style={rateText}>{`10`}</Text>
                        </View>
                    </View>
                </View>
                <AppButton
                    title={'RATE'}
                    containerStyle={{
                        marginTop: hp(2),
                        width: wp(70),
                    }}
                    textStyle={{ fontSize: Constant.fontSize.mini }}
                    onPress= {() => this.onRate()} />
            </View>
        )
    }

    render() {
        const { container,
            doctorDetailContainer, title, subTitle, profile, modalBackground,
            rateBackground } = styles;
        const { doctorData, loading, rateModalVisibility } = this.state;
        const { navigation, userDetail } = this.props;
        return (
            <View style={container}>
                <View style={{ paddingHorizontal: wp(5) }}>
                    <BackView title={'Messages'} onBackPress={() => navigation.goBack()} />
                </View>
                {doctorData != undefined &&
                    <View style={doctorDetailContainer}>
                        <View>
                            <Image source={{ uri: doctorData.Picture !== '' && doctorData.Picture || 'default_user' }} style={profile} />
                        </View>
                        <View style={{ flex: 0.8, marginLeft: wp(4) }}>
                            <Text style={subTitle}>{`Tu conversacion con`}</Text>
                            <Text style={title}>{doctorData.DisplayName === '' && 'Doctor' || "Dr. " + doctorData.DisplayName}</Text>
                        </View>
                        <TouchableOpacity style={{ flex: 0.3 }} onPress={() => this.sendWhatsAppMessage()}>
                            <Image source={{ uri: 'whatsapp_icon' }}
                                style={{
                                    height: hp(4),
                                    width: hp(5)
                                }} resizeMode={'contain'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => this.makeVideoCall()}>
                            <Image source={{ uri: 'video_call_icon' }}
                                style={{
                                    height: hp(5),
                                    width: hp(5)
                                }} resizeMode={'contain'} />
                        </TouchableOpacity>
                    </View>
                }
                <KeyboardAvoidingView
                    enabled={Constant.isIOS}
                    style={{ flex: 1, justifyContent: 'space-between' }}
                    behavior='padding'
                    keyboardVerticalOffset={hp(11)}>
                    <ScrollView
                        scrollEnabled={false}
                        keyboardShouldPersistTaps={'handled'}
                        contentContainerStyle={{ flex: 1, backgroundColor: Constant.color.background }}>
                        {this.state.sessionId != '' ? this._OTSession() : null}
                        {userDetail && userDetail.Token &&
                            <GiftedChat
                                messages={this.state.messages}
                                extraData={[this.props, this.state]}
                                onSend={messages => this.checkpermission(messages)}
                                user={{
                                    _id: 'user' + userDetail.UserID,
                                    name: userDetail.UserName,
                                    avatar: userDetail.UserPic == '' ? 'default_user' : userDetail.UserPic == undefined ? 'default_user' : userDetail.UserPic,
                                    isSender: true
                                }}
                                renderBubble={this.renderBubble}
                                renderInputToolbar={this.renderChatInputToolBar}
                                renderFooter={this.footerDemo}
                            />
                        }
                    </ScrollView>
                </KeyboardAvoidingView>
                <Modal
                    transparent={true}
                    animationType={'none'}
                    visible={loading}
                    onRequestClose={() => { console.log('close modal') }}>
                    <View style={modalBackground}>
                        <ActivityIndicator
                            animating={loading} size="large" color='#000000' />
                    </View>
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Constant.color.background,
    },
    doctorDetailContainer: {
        ...Constant.shadowStyle,
        backgroundColor: Constant.color.white,
        borderRadius: wp(5),
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(2),
        paddingHorizontal: wp(7),
        marginBottom: hp(1)
    },
    title: {
        color: Constant.color.darkBlue,
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.xsmall,
        fontWeight: '600'
    },
    subTitle: {
        color: Constant.color.darkGray,
        fontFamily: Constant.font.Nunito_Regular,
        marginTop: hp(0.5),
        fontSize: Constant.fontSize.mini,
    },
    profile: {
        height: 60,
        width: 60,
        borderRadius: 30
    },
    modalBackground: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(52, 52, 52, 0.5)'
    },
    rateBackground: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Constant.color.modalBackground,
        marginTop: Constant.isIOS && (Constant.isX ? hp(13) : hp(11)) || hp(8)
    },
    rateModalView: {
        ...Constant.shadowStyle,
        backgroundColor: Constant.color.white,
        borderRadius: wp(5),
        paddingVertical: hp(3),
        paddingHorizontal: wp(8),
        marginTop: hp(8)
    },
    rateTitleText: {
        color: Constant.color.blue,
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.medium,
        marginBottom: hp(1),
        textAlign: 'center'
    },
    rateSubTitleText: {
        color: Constant.color.navyBlue,
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.mini,
        marginTop: hp(2),
        marginBottom: hp(5)
    },
    rateText: {
        color: Constant.color.blue,
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.xxsmall,
    }
});

export { Chat }