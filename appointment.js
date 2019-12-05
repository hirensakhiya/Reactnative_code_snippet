import React, { Component } from 'react';
import { StyleSheet, Text, View, Image, KeyboardAvoidingView, TouchableOpacity, Modal, Switch, Alert, PanResponder } from 'react-native';
import Constant from '../../helper/themeHelper';
import { TermsAndConditionAppointment } from '../../helper/appConstant';
import { ModalDropdown, AppButton, ScrollPicker, LoadingIndicator } from '../common';
import { wp, hp } from '../../helper/responsiveScreen';
import { ScrollView } from 'react-native-gesture-handler';
import moment from 'moment'
import { LocaleConfig, Calendar } from 'react-native-calendars';

LocaleConfig.locales['sp'] = {
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dic'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
    today: 'Aujourd\'hui'
};

let calenderTheme = {
         backgroundColor: Constant.color.white,
        calendarBackground: Constant.color.white,
        textSectionTitleColor: Constant.color.blue,
        selectedDayBackgroundColor: Constant.color.blue,
        selectedDayTextColor: Constant.color.white,
        todayTextColor: Constant.color.blue,
        dayTextColor: Constant.color.blue,
        textDisabledColor: Constant.color.gray,
        arrowColor: Constant.color.navyBlue,
        monthTextColor: Constant.color.blue,
        indicatorColor: 'blue',
        dotColor: Constant.color.blue,
        textDayFontFamily: Constant.font.Nunito_Regular,
        textMonthFontFamily: Constant.font.Nunito_Bold,
        textDayHeaderFontFamily: Constant.font.Nunito_Regular,
        textMonthFontWeight: 'bold',
        textDayFontSize: Constant.fontSize.xxsmall,
        textMonthFontSize: Constant.fontSize.xxsmall,
        textDayHeaderFontSize: Constant.fontSize.xxsmall - 2,
}

LocaleConfig.defaultLocale = 'sp';

class Appointment extends Component {

    constructor(props) {
        super(props)
        this.state = {
            selectedTab: props.navigation && props.navigation.state && props.navigation.state.params && props.navigation.state.params.selectedIndex,
            selectedDoctorType: '',
            doctorType: '',
            selectedDoctorName: '',
            nextAppointment: '',
            nextAppointments: [],
            moreNextAppointmentVisibility: false,
            moreFutureAppointmentVisibility: false,
            cancelAppointmentModalVisibility: false,
            cancelAppointmentId: '',
            doctorsType: [],
            doctors: [],
            selectedDate: null,
            selectedTime: null,
            _markedDates: [],
            dayArray: [],
            slotValue: [],
            dateTimeArray: [],
            selectedIndex: 0,
            selectedDoctorObj: null,
            btnColor: Constant.color.lightGray,
            successModalVisibility: false,
            failureModalVisibility: false,
            selectedFutureAppoinmentData: '',
            selectedListIndex: 0,
            isLoading: false,
            appointmentID: '',
            isTermsAndCondition: false
        }
    }

    componentDidMount() {
        const { userDetail } = this.props
        this.didFocusListener = this.props.navigation.addListener(
            'didFocus',
            () => {
                if (userDetail && userDetail.Token) {
                    // this.getAllDoctorType();
                    this.getNextAppointment();
                    console.log('Token...', userDetail.Token)
                } else {
                    console.log('Token... You are logout')
                }
            },
        );
    }

    componentWillMount() {
        const { userDetail } = this.props

        this._panResponder = PanResponder.create({
            onMoveShouldSetResponderCapture: () => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
                return Math.abs(gestureState.dy) > 2;  // can adjust this num
            },
            onPanResponderGrant: (e, gestureState) => {
                this.fScroll.setNativeProps({ scrollEnabled: false })
            },
            onPanResponderMove: () => {
            },
            onPanResponderRelease: () => {
                this.fScroll.setNativeProps({ scrollEnabled: true })
            },
            onPanResponderTerminate: () => {
                this.fScroll.setNativeProps({ scrollEnabled: true })
            },
            onPanResponderTerminationRequest: () => true,
        })


        const selectedDay = moment(new Date()).format("YYYY-MM-DD");
        this.setState({ _markedDates: { [selectedDay]: { selected: true, marked: true, selectedColor: Constant.color.blue } } })

        if (userDetail && userDetail.Token) {
            this.getAllDoctorType();
            this.getNextAppointment();
            console.log('Token...', userDetail.Token)
        } else {
            console.log('Token... You are logout')
        }
    }

    componentWillUnmount() {
        this.didFocusListener.remove();
    }

    getAllDoctorType = () => {
        const { handleLocalAction, localActions, userDetail } = this.props;
        this.setState({ isLoading: true })
        handleLocalAction({
            type: localActions.ALL_DOCTORS, data: {
                in_Token: userDetail.Token
            }
        }).then(res => {
            this.setState({ isLoading: false })
            if (res) {
                if (res.status === '200') {
                    this.state.doctors = [];
                    res.data.result.map((item, index) => {
                        this.state.doctorsType.push(item.Profile);
                    })
                }
            }
        }).catch(e => {
            this.setState({ isLoading: false })
            console.log(e);
        });
    }

    getAllDoctorNames = () => {
        const { handleLocalAction, localActions, userDetail } = this.props;
        this.setState({ isLoading: true })
        handleLocalAction({
            type: localActions.GET_ALL_DOCTORNAMES_BYTYPE, data: {
                in_Token: userDetail.Token,
                in_DoctorType: this.state.selectedDoctorType
            }

        }).then(res => {
            if (res) {
                this.setState({ isLoading: false })
                this.state.doctors = [];
                if (res.status === '200') {
                    res.data.result.map((item, index) => {
                        if (!(item.haveSlots === "0" || item.haveSlots === null)) {
                            this.state.doctors.push(item);
                        }
                    });

                    if (this.state.doctors.length > 0) {
                        this.setState({ doctorsNameVisiblity: true, fromAppointment: true })
                    }
                    else {
                        this.setState({ doctorsNameVisiblity: false, fromAppointment: false }, () => {
                            Alert.alert('Notificación', 'No hay este tipo de médico disponible en este momento.')
                        })
                    }
                }
                else {
                    Alert.alert('Notificación', 'No hay este tipo de médico disponible en este momento.')
                }
            }
        }).catch(e => {
            this.setState({ isLoading: false })
            console.log(e);
        });
    }

    onDoctorNameSelect = (doctorObj) => {
        const { handleLocalAction, localActions, userDetail } = this.props;
        const { selectedDoctorType } = this.state;

        this.setState({ selectedDoctorName: doctorObj.DoctorName, selectedDoctorObj: doctorObj, isLoading: true })
        handleLocalAction({
            type: localActions.GET_ALL_DOCTOR_SLOT_BY_DOCTOR_ID, data: {
                in_Token: userDetail.Token,
                in_DoctorID: doctorObj.DoctorId,
                in_DoctorType: selectedDoctorType
            }
        }).then(res => {
            if (res) {
                this.setState({ isLoading: false })
                console.log('doctortype select', JSON.stringify(res));
                if (res.status === '200') {
                    this.state._markedDates = [];
                    this.state.dayArray = [];
                    this.state.dateTimeArray = [];
                    let scheduleArr = this.state.dayArray;
                    let _slotValue = this.state.slotValue;

                    res.data.result.map((item, index) => {
                        const _selectedDay = item.Date;

                        _slotValue.push(item);
                        let markedDates = {}
                        if (this.state._markedDates[_selectedDay]) {
                            markedDates = this.state._markedDates[_selectedDay];
                            markedDates = { marked: true };
                        }
                        else {
                            markedDates = !this.state._markedDates[_selectedDay];
                            markedDates = { marked: true };
                        }

                        const updatedMarkedDates = { ...this.state._markedDates, ...{ [_selectedDay]: markedDates } }
                        this.setState({ _markedDates: updatedMarkedDates });

                        let obj = {
                            date: item.Date,
                            time: item.From
                        }
                        this.state.dateTimeArray.push(obj);

                        if (_selectedDay == res.data.result[0].Date) {
                            let str = item.From;
                            scheduleArr.push(str);
                        }
                    });
                    this.setState({
                        dayArray: scheduleArr,
                        slotValue: _slotValue,
                        // selectedIndex: scheduleArr.length > 1 && 1 || 0,
                        // selectedDate: res.data.result[0].Date,
                        // selectedTime: res.data.result[0].From
                    })
                    this.changeButtonState();
                }
                else {
                    alert(res.message);
                    this.setState({ isApiCall: false, appointmentVisibility: false, fromAppointment: false })
                }
            } else {
                this.setState({ isApiCall: false, appointmentVisibility: false, fromAppointment: false })
            }
        }).catch(e => {
            this.setState({ isApiCall: false, appointmentVisibility: false, fromAppointment: false, isLoading: false });
            console.log(e);
        });
    };

    changeButtonState = () => {
        const { selectedDoctorType, selectedDoctorName } = this.state;
        if (selectedDoctorType !== '' && selectedDoctorName !== '') {
            this.setState({ btnColor: Constant.color.blue });
        } else {
            this.setState({ btnColor: Constant.color.lightGray });
        }
    };

    getNextAppointment = () => {
        const { handleLocalAction, localActions, userDetail } = this.props;

        if (userDetail && userDetail.Token) {
            handleLocalAction({
                type: localActions.GET_NEXT_APPOINTMENT, data: {
                    in_Token: userDetail.Token
                }
            }).then(res => {
                if (res) {
                    this.setState({ nextAppointments: [] });
                    console.log("todays appointment", res.status)
                    if (res.status === '200') {
                        this.setState({ nextAppointment: res.data.result[0], nextAppointments: res.data.result });
                        res.data.result.map((item, index) => {
                            if (item.AppointmentID === this.state.nextAppointment.AppointmentID) {
                                this.setState({
                                    currentAppointmentId: item.AppointmentID,
                                    // selectedDate: item.Date
                                })
                            }
                        });
                    }
                    else {
                        this.setState({ nextAppointment: '' });
                    }
                    this.setState({ isLoading: false });
                }
            }).catch(e => {
                this.setState({ isLoading: false })
            });
        }
    }

    onTabChange = (index) => {
        this.setState({ selectedTab: index })
        if (index == 0) {
            if (this.state.selectedDoctorObj != null) {
                this.onDoctorNameSelect(this.state.selectedDoctorObj)
            }
        }
        else {
            this.getNextAppointment()
        }

    }

    renderTabView = (index, title) => {
        const { selectedTab } = this.state;
        return (
            <TouchableOpacity style={{
                flex: 1, borderBottomWidth: 2, marginHorizontal: wp(2),
                borderBottomColor: (selectedTab === index) && Constant.color.navyBlue || Constant.color.sky,
                paddingVertical: wp(2)
            }} onPress={() => this.onTabChange(index)}>
                <Text style={{
                    textAlign: 'center',
                    fontSize: Constant.fontSize.small,
                    color: (selectedTab === index) && Constant.color.navyBlue || Constant.color.sky,
                    fontFamily: Constant.font.Nunito_Bold
                }}>{title}</Text>
            </TouchableOpacity>
        )
    }

    onBookAppointment = () => {
        const { slotValue, selectedDate, selectedTime, selectedDoctorObj } = this.state;
        const { handleLocalAction, localActions, userDetail } = this.props;

        for (let i = 0; i < slotValue.length; i++) {
            
            if (slotValue[i].Date === selectedDate && slotValue[i].From === selectedTime) {

                this.setState({ slotID: slotValue[i].ID }, () => {
                    handleLocalAction({
                        type: localActions.BOOK_DOCTOR_SLOT, data: {
                            in_SlotID: slotValue[i].ID,
                            in_Token: userDetail.Token
                        }
                    }).then(res => {
                        if (res) {
                            if (res.status === "200") {
                                this.setState({ selectedDoctorType: '', selectedDoctorName: '', selectedDoctorObj: null, _markedDates: [], dayArray: [], selectedTime: null, slotValue: [] })
                                this.setState({ successModalVisibility: true, appointmentID: res.data[0].ID, isTermsAndCondition: false })
                            } else {
                                this.setState({ failureModalVisibility: true, appointmentID: '', isTermsAndCondition: false })
                            }
                        }
                    }).catch(e => {
                        console.log(e);
                    });
                })
            }
        }
    }

    onDateSelect = (day) => {
        const _selectedDay = moment(day.dateString).format('YYYY-MM-DD');
        if(this.state.selectedTime != null){
            this.scrollPicker.scrollToFirst();
        }

        if (this.state.dateTimeArray.some(person => person.date === _selectedDay)) {
            const updatedMarkedDates = { ...this.state._markedDates, ...{ [this.state.selectedDate]: { marked: true } } }
            this.setState({ _markedDates: updatedMarkedDates }, () => {
                const updatedMarkedDates = { ...this.state._markedDates, ...{ [_selectedDay]: { selected: true, selectedColor: Constant.color.blue } } }
                this.setState({ _markedDates: updatedMarkedDates });
            });

            let arr = [];
            for (let i = 0; i < this.state.dateTimeArray.length; i++) {
                if (this.state.dateTimeArray[i].date === _selectedDay) {
                    arr.push(this.state.dateTimeArray[i].time);
                }
            }

            this.setState({
                dayArray: arr,
                selectedIndex: 0,
                selectedDate: _selectedDay,
                selectedTime: arr[0]
            })
        } else {
            alert("¡Debe seleccionar una fecha con cita existente!");
        }
    }

    onMomentumScrollEndTime = () => {
    };

    onScrollEndDrag = () => { this.fScroll.setNativeProps({ scrollEnabled: true }) };

    onTouchStart = () => { };

    onValueChangeTime = (data, selectedIndex) => {
        this.setState({ selectedTime: data })
    };

    onBookAppointmentClick = () => {
        const { selectedDate, selectedTime } = this.state;
        if (selectedDate != null && selectedTime != null) {
            this.setState({ isTermsAndCondition: true })
        }
        else {
            alert('¡Debes seleccionar una fecha!')
        }
    };

    renderDropdownRow = (item, index) => {
        const {  dropdownFontStyle } = styles;
        return (
            <View style={{ paddingHorizontal: wp(5), backgroundColor: Constant.color.white }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: hp(1.5) }}>
                    <Text style={dropdownFontStyle}>{item.trim()}</Text>
                </View>
                <View style={{ width: '100%', height: hp(0.2), backgroundColor: Constant.color.lightSky }} />
            </View>
        )
    }

    renderBookAppointment = () => {
        const { selectedDoctorType, selectedDoctorName, doctorsType, doctors, selectedTime, selectedDoctorObj,
            _markedDates, dayArray, selectedIndex, btnColor, successModalVisibility, failureModalVisibility } = this.state;
        const { dropDownStyle, dropDownArrow, titleTextStyle, descText,
            scrollPickerContainer, modalBackground, dropdownContainerStyle, dropdownFontStyle, scrollpickerSepratorStyle, scrollpickerTextStyle } = styles;

        return (
            <View style={{ paddingHorizontal: wp(2) }}>
                <Text style={descText}>{'Reserva tu cita para una videollamada con un doctor.'}</Text>
                <View style={{ marginTop: hp(2) }}>
                    <View>
                        <Text style={titleTextStyle}>{'Tipo de médico:'}</Text>
                        <View style={{backgroundColor: 'transparent'}}>
                            <ModalDropdown ref={e => this["dropdownRef1"] = e}
                                options={doctorsType}
                                style={dropdownContainerStyle}
                                defaultValue={selectedDoctorType === '' && 'Elige un médico especialista' || selectedDoctorType}
                                textStyle={{...dropdownFontStyle, paddingHorizontal: wp(2),
                                    color: selectedDoctorType === '' && Constant.color.gray || Constant.color.black,
                                }}
                                dropdownStyle={[dropDownStyle, { maxHeight: doctorsType.length > 1 && hp(12) || hp(6) }]}
                                adjustFrame={(style) => {
                                    style.top -= hp(1)
                                    style.left -= wp(4);
                                    return style;
                                }}
                                onSelect={(selectedIndex, value) => {
                                    this.setState({ selectedDoctorType: value, doctorType: value, selectedDoctorName: '', selectedDoctorObj: null }, () => {
                                        this.getAllDoctorNames()
                                    })
                                }}
                                renderSeparator={() => <View />}
                                renderRow={(item, index) => this.renderDropdownRow(item, index)}
                                keyboardShouldPersistTaps={'always'}
                            >
                            </ModalDropdown>
                        </View>
                    </View>
                    <View style={dropDownArrow}>
                        <TouchableOpacity style={{height: wp(3), width: wp(5)}} onPress={() =>  this["dropdownRef1"].show()}>
                            <Image source={{ uri: 'dropdown' }} style={{height: '100%', width: '100%'}}  resizeMode={'contain'} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ marginTop: hp(2) }}>
                    <View>
                        <Text style={titleTextStyle}>{'Nombre del doctor:'}</Text>
                        <View style={{backgroundColor: 'transparent'}}>
                            <ModalDropdown ref={e => this["dropdownRef2"] = e}
                                options={doctors}
                                style={dropdownContainerStyle}
                                defaultValue={selectedDoctorName === '' && 'Elige un doctor por su nombre' || selectedDoctorName}
                                textStyle={{ ...dropdownFontStyle, paddingHorizontal: wp(2),
                                    color: selectedDoctorName === '' && Constant.color.gray || Constant.color.black,
                                }}
                                dropdownStyle={[dropDownStyle, { maxHeight: doctors.length > 1 && hp(12) || hp(6) }]}
                                adjustFrame={(style) => {
                                    style.top -= hp(1)
                                    style.left -= wp(4);
                                    return style;
                                }}
                                onSelect={(selectedIndex, value) => {this.onDoctorNameSelect(value)}}
                                renderSeparator={() => <View />}
                                renderRow={(item, index) => this.renderDropdownRow(item.DoctorName, index)}
                                keyboardShouldPersistTaps={'always'}
                            />
                        </View>
                        <View style={dropDownArrow}>
                            <TouchableOpacity style={{height: wp(3), width: wp(5)}} onPress={() =>  this["dropdownRef2"].show()}>
                                <Image source={{ uri: 'dropdown' }} style={{height: '100%', width: '100%'}} resizeMode={'contain'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {selectedDoctorObj != null &&
                    <View style={{ marginTop: hp(3), flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={titleTextStyle}>{'Cédula Profesional : '}</Text>
                        <Text style={{ ...descText, marginLeft: wp(1) }}>{selectedDoctorObj.ProfesionalNo != null && selectedDoctorObj.ProfesionalNo}</Text>
                    </View>
                }

                <View style={{ marginTop: hp(2) }}>
                    <Text style={titleTextStyle}>{'Fecha:'}</Text>
                </View>

                <Calendar
                    minDate={Date()}
                    onDayPress={(day) => { this.onDateSelect(day) }}
                    onDayLongPress={(day) => { console.log('selected day', day) }}
                    monthFormat={'MMM yyyy'}
                    onMonthChange={(month) => { console.log('month changed', month) }}
                    hideExtraDays={true}
                    firstDay={1}
                    onPressArrowLeft={substractMonth => substractMonth()}
                    onPressArrowRight={addMonth => addMonth()}

                    style={{ ...Constant.shadowStyle, borderRadius: wp(5), marginTop: hp(2), paddingVertical: hp(1) }}

                    theme={calenderTheme}

                    markedDates={_markedDates}
                />

                {selectedTime != null &&
                    <View style={{ marginTop: hp(2) }}>
                        <Text style={titleTextStyle}>{'Hora:'}</Text>
                        <View style={{
                            height: hp(18), overflow: 'hidden'
                        }}>
                            <ScrollPicker
                                onRef={ref => (this.scrollPicker = ref)}
                                dataSource={dayArray}
                                selectedIndex={selectedIndex}
                                onValueChange={(data, selectedIndex) => {this.onValueChangeTime(data, selectedIndex)}}
                                panResponder={(dayArray.length > 1) && this._panResponder.panHandlers}
                                containerStyle={scrollPickerContainer}
                                sepratorStyle={scrollpickerSepratorStyle}
                                textStyle={scrollpickerTextStyle}
                                onMomentumScrollEnd={this.onMomentumScrollEndTime}
                                onScrollEndDrag={this.onScrollEndDrag}
                                onTouchStart={this.onTouchStart}
                                wrapperHeight={hp(18)}
                                itemHeight={hp(7)}
                            />
                        </View>
                    </View>
                }

                <AppButton
                    title={'RESERVA UNA CITA'}
                    disabled={this.state.btnColor !== Constant.color.blue}
                    containerStyle={{ marginTop: hp(4), backgroundColor: btnColor }}
                    textStyle={{ fontSize: Constant.fontSize.xxsmall }}
                    onPress={() => {
                        this.onBookAppointmentClick()
                    }}
                />

                <Modal
                    transparent={true}
                    animationType="fade"
                    visible={successModalVisibility}
                    onRequestClose={() => { console.log('close modal') }}>
                    <View style={[modalBackground, { justifyContent: 'center' }]}>
                        {successModalVisibility && this.successModal()}
                    </View>
                </Modal>

                <Modal
                    transparent={true}
                    animationType="fade"
                    visible={failureModalVisibility}
                    onRequestClose={() => { console.log('close modal') }}>
                    <View style={[modalBackground, { justifyContent: 'center' }]}>
                        {failureModalVisibility && this.failureModal()}
                    </View>
                </Modal>
            </View>
        )
    };

    goToHome = () => {
        this.setState({ successModalVisibility: false, failureModalVisibility: false }, () => {
            this.props.navigation.goBack()
        })
    };

    goToHistory = () => {
        this.setState({ successModalVisibility: false, failureModalVisibility: false }, () => {
            this.onTabChange(1)
        })
    };

    successModal = () => {
        const { successModalView, modalTitle, descText } = styles;
        const { navigation } = this.props;
        const { appointmentID, doctorType } = this.state;
        let btnTitle = 'QUESTIONARIO MÉDICO';

        debugger
        switch (doctorType) {
            case 'Médico':
                btnTitle = 'QUESTIONARIO MÉDICO';
                break;
            case 'Nutriólogo':
                btnTitle = 'CUESTIONARIO NUTRICIONAL';
                break;
            case 'Psicólogo':
                btnTitle = 'CUESTIONARIO DE PSICOLOGÍA';
                break;
            case 'Pediatra':
                btnTitle = 'CUESTIONARIO PEDIATRA';
                break;
        }

        return (
            <View style={successModalView}>
                <Image
                    source={{ uri: 'success_icon' }}
                    style={{ height: hp(7), width: hp(7) }}
                    resizeMode={'contain'} >
                </Image>
                <Text style={[modalTitle, { fontSize: Constant.fontSize.small }]}>{`ÉXITO`}</Text>
                <Text style={[descText, { marginTop: hp(1) }]}>{`Cita realizada con éxito.`}</Text>
                <View style={{ marginTop: hp(4) }}>

                    <AppButton
                        title={btnTitle}
                        containerStyle={{
                            borderWidth: 1, borderColor: Constant.color.blue,
                            backgroundColor: Constant.color.blue, marginBottom: hp(2),
                            paddingVertical: hp(1.5), borderRadius: hp(2),
                            paddingHorizontal: wp(5)
                        }}
                        textStyle={{ fontSize: Constant.fontSize.mini }}
                        onPress={() => {
                            this.setState({ successModalVisibility: false , selectedTab:1}, () => {
                                navigation.navigate('MedicalQuestionnaire', { appointmentID })
                            })
                        }}
                    />
                    <AppButton
                        title={'IR A LA PANTALLA DE INICIO'}
                        containerStyle={{
                            borderWidth: 1, borderColor: Constant.color.blue,
                            backgroundColor: Constant.color.white, marginBottom: hp(2),
                            paddingVertical: hp(1.5), borderRadius: hp(2)
                        }}
                        textStyle={{ fontSize: Constant.fontSize.mini, color: Constant.color.blue }}
                        onPress={() => this.goToHome()}
                    />
                    <AppButton
                        title={'VER TU CITA'}
                        containerStyle={{
                            borderWidth: 1, borderColor: Constant.color.blue,
                            backgroundColor: Constant.color.white,
                            paddingVertical: hp(1.5), borderRadius: hp(2)
                        }}
                        textStyle={{ fontSize: Constant.fontSize.mini, color: Constant.color.blue }}
                        onPress={() => this.goToHistory()}
                    />
                </View>
            </View>
        )
    }

    failureModal = () => {
        const { successModalView, modalTitle, descText } = styles;
        return (
            <View style={successModalView}>
                <Image
                    source={{ uri: 'failure_icon' }}
                    style={{ height: hp(7), width: hp(7) }}
                    resizeMode={'contain'} >
                </Image>
                <Text style={[modalTitle, { fontSize: Constant.fontSize.small }]}>{`SIN ÉXITO`}</Text>
                <Text style={[descText, { marginTop: hp(1), textAlign: 'center' }]}>{`Ya hiciste una cita hoy con\neste tipo de médico.\nPor favor, elija otro tipo de médico.`}</Text>
                <View style={{ marginTop: hp(4) }}>
                    <AppButton
                        title={'INTENTA DE NUEVO'}
                        containerStyle={{
                            borderWidth: 1, borderColor: Constant.color.blue,
                            backgroundColor: Constant.color.blue, marginBottom: hp(2),
                            paddingVertical: hp(1.5), borderRadius: hp(2),
                            paddingHorizontal: wp(5)
                        }}
                        textStyle={{ fontSize: Constant.fontSize.mini }}
                        onPress={() => this.setState({ failureModalVisibility: false })}
                    />
                    <AppButton
                        title={'IR A LA PANTALLA DE INICIO'}
                        containerStyle={{
                            borderWidth: 1, borderColor: Constant.color.blue,
                            backgroundColor: Constant.color.white,
                            paddingVertical: hp(1.5), borderRadius: hp(2),
                            paddingHorizontal: wp(5)
                        }}
                        textStyle={{ fontSize: Constant.fontSize.mini, color: Constant.color.blue }}
                        onPress={() => this.goToHome()}
                    />
                </View>
            </View>
        )
    }

    onNextAppointmentMoreClick = () => {
        this.setState({ moreNextAppointmentVisibility: !this.state.moreNextAppointmentVisibility })
    }

    onFutureAppointmentMoreClick = (item, index) => {
        this.setState({
            selectedFutureAppoinmentData: item,
            moreFutureAppointmentVisibility: index == this.state.selectedListIndex ? !this.state.moreFutureAppointmentVisibility : true,
            selectedListIndex: index
        })
    }

    onCancel = (id) => {
        this.setState({
            moreNextAppointmentVisibility: !this.state.moreNextAppointmentVisibility,
            cancelAppointmentModalVisibility: true,
            cancelAppointmentId: id
        })
    }

    onCancelFuture = (id) => {
        this.setState({
            moreFutureAppointmentVisibility: !this.state.moreFutureAppointmentVisibility,
            cancelAppointmentModalVisibility: true,
            cancelAppointmentId: id
        })
    }

    onCancelAppointment = () => {
        const { handleLocalAction, localActions, userDetail } = this.props;

        handleLocalAction({
            type: localActions.CANCEL_APPOINTMENT, data: {
                in_AppointmentID: this.state.cancelAppointmentId,
                in_Token: userDetail.Token
            }
        }).then(res => {
            if (res) {
                if (res.status === "200") {
                    this.setState({ cancelAppointmentModalVisibility: false, cancelAppointmentId: '' });
                    this.getNextAppointment();
                }
            }
        }).catch(e => {
            console.log(e);
        });

    }

    onCall = (id) => {
        this.setState({
            moreNextAppointmentVisibility: !this.state.moreNextAppointmentVisibility
        })
        this.props.navigation.navigate('ChatScreen', { doctorId: id })
    }

    onCallFuture = (id) => {
        this.setState({
            moreFutureAppointmentVisibility: !this.state.moreFutureAppointmentVisibility
        })
        this.props.navigation.navigate('ChatScreen', { doctorId: id })
    }

    renderAppointnmentHistory = () => {
        const { nextAppointment, nextAppointments, selectedFutureAppoinmentData, moreNextAppointmentVisibility,
            moreFutureAppointmentVisibility, cancelAppointmentModalVisibility, selectedListIndex } = this.state;
        const { descText, titleTextStyle, nextAppointmentView, historyAppointmentView,
            whiteDot, grayDot, nextAppointmentTitle, nextAppointmentSubtitle,
            historyAppointmentTitle, historyAppointmentSubtitle, moreView, moreFutureView, moreText, moreFutureText,
            modalBackground, cancelModalView, modalTitle } = styles;
        const { navigation } = this.props;

        return (
            <View style={{ paddingHorizontal: wp(2) }}>
                <Text style={descText}>{'Mantén un registro de tus citas.'}</Text>
                <View style={{ marginTop: hp(3) }}>
                    <Text style={titleTextStyle}>{'Próxima:'}</Text>
                    {nextAppointment != '' &&
                        <TouchableOpacity
                            style={nextAppointmentView}
                            onPress={() => navigation.navigate("AppointmentDetail", { AppointmentObj: nextAppointment })}>
                            <View>
                                <Text style={nextAppointmentTitle}>{moment(nextAppointment.Date).format('MMMM DD') + ", " + nextAppointment.From}</Text>
                                <Text style={nextAppointmentSubtitle}>{'con Dr. ' + nextAppointment.DoctorName}</Text>
                            </View>
                            <TouchableOpacity style={{ flexDirection: 'row', padding: hp(2) }}
                                onPress={() => this.onNextAppointmentMoreClick()}>
                                {
                                    [1,2,3].map((item, index) => <View style={whiteDot}/>)
                                }
                            </TouchableOpacity>
                        </TouchableOpacity>
                    }
                </View>
                {moreNextAppointmentVisibility &&
                    <View style={moreView}>
                        <TouchableOpacity onPress={() => this.onCall(nextAppointment.DoctorId)}>
                            <Text style={moreText}>{'Llama al doctor'}</Text>
                        </TouchableOpacity>
                        <View style={{ flex: 1, width: '100%', marginVertical: hp(1), height: 1, backgroundColor: Constant.color.sepratorColor }} />
                        <TouchableOpacity onPress={() => this.onCancel(nextAppointment.AppointmentID)}>
                            <Text style={moreText}>{'Cancelar cita'}</Text>
                        </TouchableOpacity>
                    </View>
                }
                <View style={{ marginTop: hp(5) }}>
                    <Text style={titleTextStyle}>{'Futura:'}</Text>
                    {
                        nextAppointments.map((item, index) => {
                            return (
                                index > 0 &&
                                <View key={index}>
                                    <View style={{ flexDirection: 'row', marginTop: hp(2), justifyContent: 'space-between', alignItems: 'center' }}>
                                        <TouchableOpacity style={historyAppointmentView}
                                            onPress={() => navigation.navigate("AppointmentDetail", { AppointmentObj: item })}>
                                            <Text style={historyAppointmentTitle}>{moment(item.Date).format('MMMM DD') + ", " + item.From}</Text>
                                            <Text style={historyAppointmentSubtitle}>{'con Dr. ' + item.DoctorName}</Text>
                                        </TouchableOpacity>
                                        {moreFutureAppointmentVisibility && selectedListIndex == index &&
                                            <View style={moreFutureView}>
                                                <TouchableOpacity onPress={() => this.onCallFuture(selectedFutureAppoinmentData.DoctorId)}>
                                                    <Text style={moreFutureText}>{'Llama al doctor'}</Text>
                                                </TouchableOpacity>
                                                <View style={{ width: '100%', marginVertical: hp(1), height: 1, backgroundColor: Constant.color.sepratorColor }}/>
                                                <TouchableOpacity onPress={() => this.onCancelFuture(selectedFutureAppoinmentData.AppointmentID)}>
                                                    <Text style={moreFutureText}>{'Cancelar cita'}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        }
                                        <TouchableOpacity onPress={() => this.onFutureAppointmentMoreClick(item, index)}
                                            style={{ flex: 0.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: hp(2) }}>
                                            {
                                                [1,2,3].map((item, index) => <View style={grayDot}/>)
                                            }
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )
                        })
                    }
                </View >
                <Modal
                    transparent={true}
                    animationType="fade"
                    visible={cancelAppointmentModalVisibility}
                    onRequestClose={() => { console.log('close modal') }}>
                    <View style={modalBackground}>
                        <View style={cancelModalView}>
                            <Text style={modalTitle}>{`Esta seguro que quiere cancelar su cita?`}</Text>
                            <View style={{ flexDirection: 'row', marginTop: hp(4) }}>
                                <TouchableOpacity
                                    style={{
                                        marginRight: wp(2), borderWidth: 1, borderRadius: hp(3),
                                        borderColor: Constant.color.blue, backgroundColor: Constant.color.blue,
                                        paddingVertical: hp(1), paddingHorizontal: wp(8)
                                    }}
                                    onPress={() => this.onCancelAppointment()}>
                                    <Text style={nextAppointmentSubtitle}>{`Si`}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        marginLeft: wp(2), borderWidth: 1, borderRadius: hp(3),
                                        borderColor: Constant.color.blue, backgroundColor: Constant.color.white,
                                        paddingVertical: hp(1), paddingHorizontal: wp(8)
                                    }}
                                    onPress={() => { this.setState({ cancelAppointmentModalVisibility: false, cancelAppointmentId: '' }) }}>
                                    <Text style={[historyAppointmentSubtitle, { color: Constant.color.blue }]}>{`No`}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View >
        )
    }

    renderTermsAndCondition = () => {
        const { safeArea } = this.props;
        const { modalMainView, modalContainer, modalCloseView, modalRightIconStyle, center, backTextStyle, historyAppointmentSubtitle } = styles;
        return (
            <View style={modalMainView}>
                <View style={modalContainer}>
                    <View style={{ flexDirection: 'row', ...center }}>
                        <Text style={{ flex: 1, ...backTextStyle, fontSize: Constant.fontSize.xxxsmall }}>
                            {'Al usar nuestra aplicación, debe aceptar los siguientes términos y condiciones antes de la confirmación de la cita.'}
                        </Text>
                        <TouchableOpacity style={modalCloseView} onPress={() => this.setState({ isTermsAndCondition: false })}>
                            <Image source={{ uri: 'x' }} style={modalRightIconStyle} resizeMode={'contain'} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ height: hp('45%'), marginTop: hp(2) }}>
                        <Text style={historyAppointmentSubtitle}>{TermsAndConditionAppointment}</Text>
                    </ScrollView>
                    <AppButton
                        containerStyle={{ marginTop: hp('2.5%') }}
                        title={'OK'}
                        onPress={() => { this.onBookAppointment() }}
                    />
                </View>
            </View>
        )
    }

    render() {
        const { container, leftHeaderIcon, backTextStyle } = styles;
        const { navigation } = this.props;
        const { selectedTab, isLoading, isTermsAndCondition } = this.state;
        return (
            <View style={container}>
                <LoadingIndicator isLoading={isLoading} />
                <View style={{ ...container, paddingHorizontal: wp(5) }}>
                    {selectedTab != undefined &&
                        <View style={{ flexDirection: 'row', marginVertical: hp(2) }}>
                            {this.renderTabView(0, 'Reserva una cita')}
                            {this.renderTabView(1, 'Próximas citas')}
                        </View>
                        ||
                        this.setState({ selectedTab: 1 })
                    }

                    <KeyboardAvoidingView
                        enabled={true}
                        style={{ flex: 1 }}
                        behavior='height'
                        keyboardVerticalOffset={Constant.isX ? hp(13) : hp(11)}>
                        <ScrollView
                            ref={(e) => { this.fScroll = e }}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingVertical: hp(1) }}>
                            {selectedTab == 0 &&
                                this.renderBookAppointment() ||
                                this.renderAppointnmentHistory()
                            }
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
                <Modal transparent={true}
                    animationType="fade"
                    visible={isTermsAndCondition}>
                    {isTermsAndCondition && this.renderTermsAndCondition()}
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Constant.color.background
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    leftHeaderIcon: {
        flexDirection: 'row',
        paddingTop: hp(3),
        paddingHorizontal: wp(3),
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    backTextStyle: {
        fontSize: Constant.fontSize.xmedium,
        color: Constant.color.blue,
        fontFamily: Constant.font.Nunito_Bold
    },
    dropdownContainerStyle: {
        ...Constant.shadowStyle,
        paddingLeft: wp(4),
        backgroundColor: Constant.color.white,
        height: Constant.isIOS ? hp(6) : hp(8),
        borderRadius: wp(5),
        justifyContent: 'center',
        marginTop: hp(1)
    },
    dropDownStyle: {
        ...Constant.shadowStyle,
        backgroundColor: Constant.color.white,
        borderBottomRightRadius: 15,
        borderBottomLeftRadius: 15,
        overflow: 'hidden',
        position: 'absolute',
        top: 10,
        width: wp(86),
        maxHeight: hp(12),
    },
    dropdownFontStyle: {
        fontFamily: Constant.font.Nunito_Regular,
        fontSize: Constant.fontSize.xxsmall,
        color: Constant.color.blue
    },
    titleTextStyle: {
        fontSize: Constant.fontSize.xsmall,
        color: Constant.color.navyBlue,
        fontFamily: Constant.font.Nunito_Bold,
    },
    descText: {
        fontSize: Constant.fontSize.xxsmall,
        color: Constant.color.navyBlue,
        fontFamily: Constant.font.Nunito_Regular,
    },
    dropDownArrow: {
        position: 'absolute',
        top: hp(4),
        bottom: 0,
        width: wp(5),
        right: wp(5),
        zIndex: 100000000,
        alignItems: 'center',
        justifyContent: 'center'
    },
    nextAppointmentView: {
        padding: wp(6),
        backgroundColor: Constant.color.blue,
        borderRadius: wp(5),
        marginTop: hp(2),
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    historyAppointmentView: {
        flex: 0.8,
        ...Constant.shadowStyle,
        paddingVertical: hp(2),
        paddingHorizontal: wp(6),
        backgroundColor: Constant.color.white,
        borderRadius: wp(5),
        justifyContent: 'center',
    },
    whiteDot: {
        backgroundColor: Constant.color.white,
        borderRadius: wp(1.2 / 2),
        height: wp(1.2),
        width: wp(1.2),
        marginHorizontal: wp(0.3)
    },
    grayDot: {
        backgroundColor: Constant.color.gray,
        borderRadius: wp(1.2 / 2),
        height: wp(1.2),
        width: wp(1.2),
        marginHorizontal: wp(0.3)
    },
    nextAppointmentTitle: {
        fontSize: Constant.fontSize.xsmall,
        color: Constant.color.white,
        fontFamily: Constant.font.Nunito_Bold,
    },
    nextAppointmentSubtitle: {
        fontSize: Constant.fontSize.mini,
        color: Constant.color.white,
        fontFamily: Constant.font.Nunito_Bold,
    },
    historyAppointmentTitle: {
        fontSize: Constant.fontSize.xsmall,
        color: Constant.color.navyBlue,
        fontFamily: Constant.font.Nunito_Bold,
    },
    historyAppointmentSubtitle: {
        fontSize: Constant.fontSize.mini,
        color: Constant.color.navyBlue,
        fontFamily: Constant.font.Nunito_Bold,
    },
    moreView: {
        position: 'absolute',
        top: hp(17),
        right: 30,
        ...Constant.shadowStyle,
        backgroundColor: Constant.color.white,
        borderRadius: wp(5),
        alignItems: 'center',
        paddingVertical: hp(2),
        paddingHorizontal: wp(5),
    },
    moreFutureView: {
        marginLeft: wp(2),
        flex: 0.8,
        ...Constant.shadowStyle,
        backgroundColor: Constant.color.white,
        borderRadius: wp(5),
        alignItems: 'center',
        paddingVertical: hp(2.5),
        paddingHorizontal: wp(5)
    },
    moreText: {
        color: Constant.color.blue,
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.mini,
        fontWeight: '500',
        paddingHorizontal: wp(8),
    },
    moreFutureText: {
        color: Constant.color.blue,
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.mini,
        fontWeight: '500',
        paddingHorizontal: wp(2),
    },
    modalBackground: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: Constant.color.modalBackground,
        marginTop: Constant.isIOS && (Constant.isX ? hp(13) : hp(11)) || hp(8),
        marginBottom: Constant.isX ? hp(12) : hp(8)
    },
    successModalView: {
        ...Constant.shadowStyle,
        backgroundColor: Constant.color.white,
        borderRadius: wp(5),
        alignItems: 'center',
        paddingVertical: hp(4),
        paddingHorizontal: wp(8),
    },
    cancelModalView: {
        marginTop: Constant.isX ? hp(19) : hp(21),
        ...Constant.shadowStyle,
        backgroundColor: Constant.color.white,
        borderRadius: wp(5),
        alignItems: 'center',
        paddingVertical: hp(4),
        paddingHorizontal: wp(9),
    },
    modalTitle: {
        fontSize: Constant.fontSize.xxsmall,
        color: Constant.color.blue,
        fontFamily: Constant.font.Nunito_Bold,
        marginTop: hp(2)
    },
    scrollPickerContainer: {
        flex: 1,
        width: wp(80),
        overflow: 'hidden',
        alignSelf: 'center',
    },
    modalMainView: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: hp(100),
        width: wp(100),
        minHeight: hp(55)
    },
    modalContainer: {
        ...Constant.shadowStyle,
        width: wp(83),
        borderRadius: 15,
        backgroundColor: Constant.color.white,
        padding: wp(3)
    },
    modalCloseView: {
        marginHorizontal: wp(3),
        marginVertical: wp(3),
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalRightIconStyle: {
        height: hp(3),
        width: hp(3),
        tintColor: Constant.color.darkGray
    },
    scrollpickerSepratorStyle: {
        position: 'absolute',
        top: Constant.isIOS ? (hp(18) - hp(7)) / 2 : (hp(20) - hp(6)) / 2,
        height: hp(7),
        width: wp(50),
        borderTopColor: Constant.color.white,
        borderTopWidth: 2,
        borderBottomColor: Constant.color.white,
        borderBottomWidth: 2,
        alignSelf: 'center'
    },
    scrollpickerTextStyle: {
        fontFamily: Constant.font.Nunito_Bold,
        fontSize: Constant.fontSize.medium,
        color: Constant.color.blue,
        textAlign: 'center'
    },
});

export { Appointment }
