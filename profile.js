import React, { Component } from 'react';
import { StyleSheet, Text, View, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import Constant from '../../helper/themeHelper';
import { wp, hp } from '../../helper/responsiveScreen';
import { ScrollView } from 'react-native-gesture-handler';
import WC from 'world-countries'
import _ from 'lodash'

class Profile extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isPicLoading: true,
            countries: [],
            code: null
        };
    }

    componentWillMount() {
        const { handleLocalAction, localActions, userDetail, userAllDetail } = this.props
        if (userDetail && userDetail.Token) {
            console.log('Token...', userDetail.Token)
        } else {
            console.log('Token... You are logout')
        }

        console.log('WC', WC); 
        let countries = []
        WC.map((item, index) => {
            if (item.callingCode && item.callingCode[0] && item.flag) {
                console.log("WC item", JSON.stringify(item.name.common))
                let arr = {
                    flag: item.flag,
                    callingCode: parseInt(item.callingCode[0]),
                    name: item.name.common
                }
                countries.push(arr)
            }
        });

        countries = _.orderBy(countries, ['callingCode'], ['asc']);
        
        var index = countries.findIndex(function(countrie) {
            return countrie.name == userAllDetail.Country
          });

        if(index != -1){
            this.setState({ countries, code: countries[index] })
        }
        else{
            this.setState({ countries, code: countries[26] })
        }
    }

    onEdit = () => {
        this.props.navigation.navigate('EditProfile',{countries: this.state.countries, onGoBack: () => this.refresh()})
    }

    refresh = () => {
        const { userAllDetail } = this.props
        var index = this.state.countries.findIndex(function(countrie) {
            return countrie.name == userAllDetail.Country
        });

        this.setState({ code: this.state.countries[index] })
    }

    render() {
        const { container, profileView, profile, profileBack, nameView,
            nameText, onlineDot, editView, editText, editImage, titleText,
            valueText, sepratorView, passwordDot, imageLoader } = styles;
        const { userAllDetail } = this.props;
        const { isPicLoading,countries,code } = this.state;

        var password = [];
        if (userAllDetail && userAllDetail.Password) {
            for (let i = 0; i < userAllDetail.Password.length; i++) {

                password.push(
                    <View style={passwordDot}></View>
                )
            }
        }

        return (
            <View style={container}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{ padding: hp(4) }}>
                        <View style={profileView}>
                            {!isPicLoading && <View style={profileBack}></View> }
                            <Image
                                source={{ uri: (userAllDetail.Picture !== undefined && userAllDetail.Picture !== '')  ? userAllDetail.Picture : "user_profile" }}
                                style={profile} 
                                onLoadStart={() => this.setState({ isPicLoading: true })}
                                onLoadEnd={() => this.setState({ isPicLoading: false })}></Image>
                            <View style={imageLoader}>
                                {isPicLoading && <ActivityIndicator size="large" color={Constant.color.blue} animating={isPicLoading} />}
                            </View>
                        </View>
                        <View style={nameView}>
                            <Text style={nameText}>{userAllDetail.FirstName + ' ' + userAllDetail.MiddleName + ' ' + userAllDetail.LastName}</Text>
                            <View style={onlineDot}></View>
                        </View>
                        <TouchableOpacity style={editView} onPress={() => this.onEdit()}>
                            <View>
                                <Image source={{ uri: 'edit_profile' }} style={editImage}></Image>
                            </View>
                            <Text style={editText}>Editar</Text>
                        </TouchableOpacity>
                        <View>
                            <Text style={titleText}>Correo electrónico:</Text>
                            <Text style={valueText}>{userAllDetail.Email}</Text>
                            <View style={sepratorView}></View>
                        </View>
                        <View>
                            <Text style={titleText}>Contraseña:</Text>
                            <View style={{ flexDirection: 'row', marginTop: hp(1) }}>{password}</View>
                            <View style={sepratorView}></View>
                        </View>
                        <View>
                            <Text style={titleText}>Teléfono:</Text>

                            <View style={{flexDirection:'row', alignItems: 'center', marginTop: hp(1)}}>
                                {code != null &&
                                    <View style={{flexDirection:'row', alignItems: 'center'}}>
                                    <Text style={{ fontSize: Constant.fontSize.xlarge }}>{code.flag}</Text>
                                    <Text style={[valueText,{marginTop:0}]}> {' +' + code.callingCode}</Text>
                                    </View>
                                }
                            <Text style={{...valueText,marginTop:0}}>{userAllDetail.Phone}</Text>
                        </View>
                           
                            <View style={sepratorView}></View>
                        </View>
                        <View>
                            <Text style={titleText}>Dirección:</Text>
                            <Text style={valueText}>{userAllDetail.Street + ' ' + userAllDetail.City + ' ' + userAllDetail.Country}</Text>
                            <View style={sepratorView}></View>
                        </View>
                        <View>
                            <Text style={titleText}>Empresa:</Text>
                            <Text style={valueText}>{userAllDetail.CompanyName}</Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Constant.color.background,
    },
    profileView: {
        alignItems: 'center'
    },
    profile: {
        height: wp(60),
        width: wp(60),
        borderRadius: wp(30)
    },
    profileBack: {
        position: 'absolute',
        top: 90,
        right: Constant.isX ? 32 : 36,
        backgroundColor: Constant.color.blue,
        height: Constant.isX ? wp(38) : wp(36),
        width: Constant.isX ? wp(38) : wp(36),
        borderRadius: Constant.isX ? wp(29) : wp(28)
    },
    nameView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: hp(2)
    },
    nameText: {
        color: Constant.color.darkBlue,
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.large,
        fontWeight: '500'
    },
    onlineDot: {
        backgroundColor: Constant.color.green,
        borderRadius: wp(1.5),
        height: wp(3),
        width: wp(3),
        marginLeft: wp(4)
    },
    passwordDot: {
        backgroundColor: Constant.color.blue,
        borderRadius: wp(2.5 / 2),
        height: wp(2.5),
        width: wp(2.5),
        marginHorizontal: wp(0.5)
    },
    editView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(3),
        marginBottom: hp(1)
    },
    editText: {
        color: Constant.color.blue,
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.xsmall,
        fontWeight: '600'
    },
    editImage: {
        height: wp(6),
        width: wp(6),
        marginHorizontal: wp(2)
    },
    titleText: {
        color: Constant.color.blue,
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.xxsmall,
        fontWeight: '600'
    },
    valueText: {
        color: Constant.color.blue,
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.xxsmall,
        marginTop: hp(1)
    },
    sepratorView: {
        height: 1,
        backgroundColor: Constant.color.sepratorColor,
        marginVertical: hp(2.5)
    },
    imageLoader: {
        position: 'absolute',
        height: wp(60),
        width: wp(60),
        borderRadius: wp(30),
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export { Profile }