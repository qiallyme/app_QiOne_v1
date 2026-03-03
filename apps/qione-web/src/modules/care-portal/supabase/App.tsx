
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { supabase } from './utils/supabase';

export default function App() {
    const [meds, setMeds] = useState([]);

    useEffect(() => {
        const getMeds = async () => {
            try {
                const { data, error } = await supabase.from('medications').select('*');

                if (error) {
                    console.error('Error fetching meds:', error.message);
                    return;
                }

                if (data) {
                    setMeds(data);
                }
            } catch (error) {
                console.error('Error fetching meds:', error.message);
            }
        };

        getMeds();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Medication List</Text>
            <FlatList
                data={meds}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.medName}>{item.name}</Text>
                        <Text style={styles.medDetails}>{item.dose} - {item.frequency}</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        marginTop: 40
    },
    item: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    medName: {
        fontSize: 18,
        fontWeight: '600'
    },
    medDetails: {
        fontSize: 14,
        color: '#666'
    }
});

