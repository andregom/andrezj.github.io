import React, { useState, useEffect, Fragment, useRef } from 'react';
import { StyleSheet, Image, View, Text, TextInput, KeyboardAvoidingView} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { requestPermissionsAsync, getCurrentPositionAsync } from 'expo-location';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

import api from '../services/api';
import { connect, disconnect, subscribeToNewDevs } from '../services/socket';

function Main({ navigation }) {
    const [devs, setDevs] = useState([])
    const [currentRegion, setCurrentRegion] = useState(null);
    const [techs, setTechs] = useState('');
    const [currentLocation, setCurrentLocation] = useState({
        latitude:0,
        longitude:0,
    });
    
    function setupWebsocket() {
        disconnect();

        const { latitude, longitude } = currentRegion;

        connect(
            latitude,
            longitude,
            techs,
        );
    }
    
    async function loadDevs() {
        const { latitude, longitude } = currentRegion;
        
        const response = await api.get('/search', {
            params: {
                latitude,
                longitude,
                techs,
            }
        });
        
        setDevs(response.data.devs);
        setupWebsocket();
    }

    function handleRegionChanged(region) {
        setCurrentRegion(region);
    }

    useEffect(() => {
        async function loadInitialPosition() {
            const { granted } = await requestPermissionsAsync();

            if(granted) {
                const { coords } = await getCurrentPositionAsync({
                    enableHighAccuracy: true,
                });

                const { latitude, longitude } = coords;

                setCurrentRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.04,
                    longitudeDelta: 0.09,
                })
            }

        }
        loadInitialPosition();
    }, []);

    useEffect(() => {
        subscribeToNewDevs(dev => setDevs([...devs, dev]));
    }, [devs]);


    if (!currentRegion) {
        return null;
    }

    return (
        <Fragment>
                <MapView
                    onRegionChangeComplete={handleRegionChanged}
                    //onUserLocationChange={}
                    showsUserLocation
                    intialRegion={currentRegion}
                    //region={currentRegion}
                    style={styles.map} 
                >
                {devs.map(dev => (
                    <Marker
                        key={dev._id}
                        coordinate={{ 
                            latitude: dev.location.coordinates[1],
                            longitude: dev.location.coordinates[0]
                        }}
                    >
                    <Image style={styles.avatar} source={{ uri: dev.avatar_url }}/>

                    <Callout onPress={() => {
                        navigation.navigate('Profile', { github_username: dev.github_username })
                    }}>
                        <View style={styles.callout}>
                            <Text style={styles.devName}>{dev.name}</Text>
                            <Text style={styles.devBio}>{dev.bio}</Text>
                            <Text style={styles.devTechs}>s{dev.techs.join(', ')}</Text>
                        </View>
                    </Callout>
                    </Marker>
                ))}
                </MapView>
            <KeyboardAvoidingView style={styles.keyBoardPadding}
                keyboardVerticalOffset={80}
                behavior={'padding'}
                enabled={true}>
                <View style={styles.searchForm} KeyboardAvoidingViewComponent>
                    <TextInput
                        keyboardVerticalOffset={0}
                        style={styles.searcInput}
                        placeholder="Encontrar por tecnologias"
                        placeholderTextColor="#999"
                        autoCaptilize="words"
                        autoCorrect={false}
                        value={techs}
                        onChangeText={setTechs}
                    />
                    <TouchableOpacity onPress={loadDevs} style={styles.loadButton}>
                        <MaterialIcons name="my-location" size={20} color='grey'/>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Fragment>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1,
    },

    avatar: {
        width: 54,
        height: 54,
        opacity: 0.85,
        borderRadius: 4,
        borderWidth: 4,
        borderColor: '#FFF'
    },

    callout: {
        width: 260,
        alignSelf: "baseline"
    },

    devName: {
        fontWeight: 'bold',
        fontSize: 16,
    },

    devBio: {
        color: '#666',
        marginTop: 5,
    },

    devTechs: {
       marginTop: 5, 
    },

    keyBoardPadding: {
        height: 'auto',
        display: 'flex',
        flexDirection: 'row',
    },

    searchForm: {
        position: "relative",
        left: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'row',
    },

    searchInput: {
        flex: 1,
        width: 50,
        height: 10,
        backgroundColor: '#FFF',
        color: '#333',
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset:{
            width: 4,
            height:4,
        },
        elevation: 2,
    },

    loadButton: {
        width: 50,
        height: 50,
        backgroundColor: '#6E4dFf',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
    },
})

export default Main;