import React, { Component } from 'react';
import { StyleSheet, Text, View, Image, KeyboardAvoidingView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Constant from '../../helper/themeHelper';
import { wp, hp } from '../../helper/responsiveScreen';
import { ScrollView } from 'react-native-gesture-handler';
import { UserDetailListItem } from '../common/profileComponent/userDetailListItem'
import ImagePicker from 'react-native-image-picker';
import { BackView, ModalDropdown } from '../common';

class EditProfile extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isPicLoading: true,
            userAllDetails: {
                name: '',
                fullname: {
                    fName: '',
                    mName: '',
                    lName: '',
                },
                email: '',
                phone: '',
                address: '',
                addressObj: {
                    street: '',
                    city: '',
                    country: ''
                },
                company: '',
                luzyPoints: '',
                password: '',
                passwordObj: {
                    currentPassword: '',
                    newPassword: '',
                    cnewPassword: ''
                }
            },
            edit: {
                isEditName: false,
                isEditEmail: false,
                isEditPhone: false,
                isEditAddress: false,
                isEditCompany: false,
                isEditPassword: false
            },
            imageUri: '',
            changeProfileVisibility: false,
            countries: props.navigation.state.params.countries,
            code: null
        };
    }

    componentWillMount() {
        const { handleLocalAction, localActions, userDetail, userAllDetail } = this.props
        if (userDetail && userDetail.Token) {
            handleLocalAction({ type: localActions.GET_USER_INFO, data: { in_Token: userDetail.Token } });
            console.log('Token...', userDetail.Token)
        } else {
            console.log('Token... You are logout')
        }
        
        var index = this.state.countries.findIndex(function(countrie) {
            return countrie.name == userAllDetail.Country
          });
        if(index != -1){
            this.setState({ code: this.state.countries[index] })
        }
        else{
            this.setState({ code: this.state.countries[26] })
        }
    }

    componentWillReceiveProps(nextProps) {   
        if (nextProps.userAllDetail && (nextProps.userAllDetail !== this.state.userAllDetails)) {
            const { FirstName, MiddleName, LastName, Email, Phone, Street, City, Country, CompanyName, LuzyBalance, Picture, Password } = nextProps.userAllDetail;
            let obj = {
                fullname: {
                    fName: FirstName && FirstName !== 'undefined' ? FirstName : '',
                    mName: MiddleName && MiddleName !== 'undefined' ? MiddleName : '',
                    lName: LastName && LastName !== 'undefined' ? LastName : ''
                },
                name: (FirstName && FirstName !== 'undefined' ? FirstName : '') +
                    (MiddleName && MiddleName !== 'undefined' ? ' ' + MiddleName : '') +
                    (LastName && LastName !== 'undefined' ? ' ' + LastName : ''),
                email: Email ? Email : '',
                phone: Phone ? Phone : '',
                address: (Street ? Street : '') + (City && (' ' + City)) + (Country && (' ' + Country)),
                addressObj: {
                    street: Street ? Street : '',
                    city: City ? City : '',
                    country: Country ? Country : ''
                },
                password: Password ? Password : '',
                passwordObj: {
                    currentPassword: '',
                    newPassword: '',
                    cnewPassword: ''
                },
                company: CompanyName ? CompanyName : '',
                luzyPoints: LuzyBalance ? LuzyBalance : '',
            };

            this.setState({ userAllDetails: obj, isLoading: false, imageUri: { uri: Picture } }, () => {
                console.log("user details...", this.state.userAllDetails);
            });
        }
    }

    onEdit = (data) => {
        const { safeArea } = this.props;
        const paddingOffset = (Constant.isANDROID) && hp(5) || 0
        let yMeasure = hp(8) + safeArea.top + paddingOffset;

        let edit = {
            isEditName: false,
            isEditEmail: false,
            isEditPhone: false,
            isEditAddress: false,
            isEditCompany: false,
            isEditPassword: false
        };
        if (data === "Nombre") {
            edit.isEditName = !this.state.edit.isEditName;
            this.setState({ edit });
        } else if (data === "Correo electrónico") {
            edit.isEditEmail = !this.state.edit.isEditEmail;
            this.setState({ edit });
        } else if (data === "Contraseña") {
            edit.isEditPassword = !this.state.edit.isEditPassword;
            this.setState({ edit });
        } else if (data === "Numero de teléfono") {
            edit.isEditPhone = !this.state.edit.isEditPhone;
            this.setState({ edit });
        } else if (data === "Dirección") {
            edit.isEditAddress = !this.state.edit.isEditAddress;
            this.setState({ edit });
        } else if (data === "Empresa") {
            edit.isEditCompany = !this.state.edit.isEditCompany;
            this.setState({ edit });
        }
    };

    onSaveClick = (key, value, data) => {
        const { handleLocalAction, localActions, userDetail } = this.props;
        let obj = {
            ...this.state.userAllDetails,
            [key]: value
        };

        this.setState({ userAllDetails: obj });
        this.onEdit(data);
        let bodyData = {
            in_Token: userDetail.Token,
            in_Picture: this.state.imageUri ? this.state.imageUri.uri : '',
            in_FirstName: obj.fullname.fName,
            in_MiddleName: obj.fullname.mName,
            in_LastName: obj.fullname.lName,
            in_Email: obj.email,
            in_Phone: obj.phone,
            in_Street: obj.addressObj.street,
            in_City: obj.addressObj.city,
            in_Country: this.state.code.name,
            in_CompanyName: obj.company,
            in_Password: obj.password,
            in_CountryCode: this.state.code.callingCode
        };

        handleLocalAction({ type: localActions.UPDATE_USER_INFO, data: bodyData });
    };

    onCamreClick = () => {
        this.setState({ changeProfileVisibility: !this.state.changeProfileVisibility })
    }

    onDeleteProfile = () => {
        const { handleLocalAction, localActions, userDetail } = this.props;
        const { userAllDetails } = this.state;

        this.setState({ changeProfileVisibility: !this.state.changeProfileVisibility, imageUri: '' });
        let bodyData = {
            in_Token: userDetail.Token,
            in_Picture: '',
            in_FirstName: userAllDetails.fullname.fName,
            in_MiddleName: userAllDetails.fullname.mName,
            in_LastName: userAllDetails.fullname.lName,
            in_Email: userAllDetails.email,
            in_Phone: userAllDetails.phone,
            in_Street: userAllDetails.addressObj.street,
            in_City: userAllDetails.addressObj.city,
            in_Country: this.state.code.name,
            in_CompanyName: userAllDetails.company,
            in_Password: userAllDetails.password,
            in_CountryCode: this.state.code.callingCode
        };

        handleLocalAction({ type: localActions.UPDATE_USER_INFO, data: bodyData });
    }

    onChangeProfile = () => {
        const { handleLocalAction, localActions, userDetail } = this.props;

        this.setState({ changeProfileVisibility: !this.state.changeProfileVisibility });

        ImagePicker.showImagePicker({
            title: 'Select your Display picture',
            mediaType: 'photo',
            quality: 0.2
        }, (response) => {
            if (response.didCancel) {

            } else if (response.fileSize > (1024 * 1024 * 2)) {
                alert('Image is too large to upload');
            } else if (response.error) {
                alert('ImagePicker Error: ' + response.error);
            } else {
                this.setState({ isPicLoading: true });
                const data = new FormData();
                var uri = response.uri;
                var fileName = uri.substr(uri.length - 15);

                data.append("file", {
                    name: fileName,
                    type: response.type,
                    uri: Constant.isANDROID ? response.uri : response.uri.replace("file://", "")
                });

                handleLocalAction({ type: localActions.UPLOAD_PIC, data }).then((res) => {
                    
                    let bodyData = {
                        in_Token: userDetail.Token,
                        in_Picture: res.url
                    };
                    handleLocalAction({ type: localActions.UPDATE_USER_INFO, data: bodyData }).then((res) => {
                    }).catch((err) => {
                        alert('Sorry, cannot upload/change your pic now')
                    });
                    console.log(res.payload);
                }).catch((error) => {
                    alert('Sorry, cannot upload/change your image now')
                });
            }
        });
    }

    onSelectCountry = (value) => {
        this.setState({ code: value })
    }

    onGoBack = () => {
        this.props.navigation.state.params.onGoBack();
        this.props.navigation.goBack();
    }

    render() {
        const { container, profileView, profile, profileBack, tranparentProfile,
            cameraImage, changeProfileView, changeProfileText } = styles;
        const { navigation, userAllDetail } = this.props;
        const { imageUri, changeProfileVisibility, isPicLoading,countries,code } = this.state;
        return (
            <View style={container}>
                <View style={{ paddingHorizontal: wp(5) }}>
                    <BackView title={'Usuario'} onBackPress={() => this.onGoBack()} />
                </View>
                <KeyboardAvoidingView
                    enabled={true}
                    style={container}
                    behavior='height'
                    keyboardVerticalOffset={Constant.isX ? hp(13) : hp(11)}>
                    <ScrollView
                        ref={"scrollViewRef"}
                        keyboardShouldPersistTaps='always'
                        contentContainerStyle={{ paddingBottom: hp(2) }}
                        showsVerticalScrollIndicator={false}>
                        <View>
                            <View style={profileView}>
                                <View style={profileBack}></View>
                                <Image source={(imageUri && imageUri.uri !== '') ? imageUri : { uri: "user_profile" }}
                                    style={profile}
                                    onLoadStart={() => this.setState({ isPicLoading: true })}
                                    onLoadEnd={() => this.setState({ isPicLoading: false })}></Image>
                                <View style={[tranparentProfile, { backgroundColor: (imageUri && imageUri.uri !== '') ? Constant.color.transparentWhite : 'transparent' }]}>
                                    {isPicLoading &&
                                        <ActivityIndicator size="large" color={Constant.color.blue} animating={isPicLoading} />
                                        ||
                                        <TouchableOpacity onPress={() => this.onCamreClick()}>
                                            <Image source={{ uri: 'camera' }} style={cameraImage}></Image>
                                        </TouchableOpacity>
                                    }
                                </View>
                                {changeProfileVisibility &&
                                    <View style={changeProfileView}>
                                        <TouchableOpacity onPress={() => this.onDeleteProfile()}>
                                            <Text style={changeProfileText}>{'Borrar foto'}</Text>
                                        </TouchableOpacity>
                                        <View style={{ flex: 1, width: '100%', marginVertical: hp(1), height: 1, backgroundColor: Constant.color.sepratorColor }}></View>
                                        <TouchableOpacity onPress={() => this.onChangeProfile()}>
                                            <Text style={changeProfileText}>{'Cambiar foto'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                }
                            </View>
                            <View style={{ paddingHorizontal: wp(4), marginTop: hp(5) }}>
                                <UserDetailListItem
                                    placeholder={"Nombre"}
                                    title={"Nombre"}
                                    ref={"Nombre"}
                                    value={this.state.userAllDetails.name}
                                    nameObj={this.state.userAllDetails.fullname}
                                    isEditName={this.state.edit.isEditName}
                                    editIndex={0}
                                    onEdit={(data) => this.onEdit(data)}
                                    onNameSave={(name) => this.onSaveClick('fullname', name, "Nombre")}
                                />
                                <UserDetailListItem
                                    placeholder={"Correo electrónico"}
                                    title={"Correo electrónico"}
                                    editTitle={"Correo electrónico"}
                                    ref={"Correo electrónico"}
                                    value={this.state.userAllDetails.email}
                                    isEditEmail={this.state.edit.isEditEmail}
                                    editIndex={1}
                                    onEdit={(data) => this.onEdit(data)}
                                    onEmailSave={(email) => this.onSaveClick('email', email, "Correo electrónico")}
                                />
                                <UserDetailListItem
                                    placeholder={"Contraseña"}
                                    title={"Contraseña"}
                                    ref={"Contraseña"}
                                    value={this.state.userAllDetails.password}
                                    isEditPassword={this.state.edit.isEditPassword}
                                    editIndex={2}
                                    onEdit={(data) => this.onEdit(data)}
                                    onPasswordSave={(password) => this.onSaveClick('password', password, "Contraseña")}
                                />
                                <UserDetailListItem
                                    placeholder={"Numero de teléfono"}
                                    title={"Numero de teléfono"}
                                    editTitle={"Teléfono"}
                                    ref={"Numero de teléfono"}
                                    value={this.state.userAllDetails.phone}
                                    isEditPhone={this.state.edit.isEditPhone}
                                    editIndex={3}
                                    onEdit={(data) => this.onEdit(data)}
                                    onPhoneSave={(phone) => this.onSaveClick('phone', phone, "Numero de teléfono")}
                                    countryIndex={0}
                                    countries={countries}
                                    code={code}
                                    onSelectCountry={(value) => this.onSelectCountry(value)}
                                />
                                <UserDetailListItem
                                    placeholder={"Dirección"}
                                    title={"Dirección"}
                                    ref={"Dirección"}
                                    value={this.state.userAllDetails.address}
                                    addressObj={this.state.userAllDetails.addressObj}
                                    isEditAddress={this.state.edit.isEditAddress}
                                    editIndex={4}
                                    onEdit={(data) => this.onEdit(data)}
                                    onAddressSave={(addressObj) => this.onSaveClick('addressObj', addressObj, "Dirección")}
                                />
                                <UserDetailListItem
                                    placeholder={"Nombre de tu empresa"}
                                    title={"Empresa"}
                                    editTitle={"Nombre de tu empresa"}
                                    ref={"Empresa"}
                                    value={this.state.userAllDetails.company}
                                    isEditCompany={this.state.edit.isEditCompany}
                                    editIndex={5}
                                    onEdit={(data) => this.onEdit(data)}
                                    onCompanySave={(company) => this.onSaveClick('company', company, "Empresa")}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Constant.color.background
    },
    profileView: {
        alignItems: 'center'
    },
    profile: {
        height: wp(60),
        width: wp(60),
        borderRadius: wp(30)
    },
    tranparentProfile: {
        position: 'absolute',
        height: wp(60),
        width: wp(60),
        borderRadius: wp(30),
        backgroundColor: Constant.color.transparentWhite,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cameraImage: {
        height: wp(10),
        width: wp(10),
    },
    profileBack: {
        position: 'absolute',
        top: 90,
        right: Constant.isX ? 65 : 67,
        backgroundColor: Constant.color.blue,
        height: Constant.isX ? wp(38) : wp(36),
        width: Constant.isX ? wp(38) : wp(36),
        borderRadius: Constant.isX ? wp(29) : wp(28)
    },
    changeProfileView: {
        position: 'absolute',
        top: 150,
        ...Constant.shadowStyle,
        backgroundColor: Constant.color.white,
        borderRadius: wp(5),
        alignItems: 'center',
        paddingVertical: hp(2),
        paddingHorizontal: wp(6),
    },
    changeProfileText: {
        color: Constant.color.blue,
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.mini,
        fontWeight: '500'
    }
});

export { EditProfile }