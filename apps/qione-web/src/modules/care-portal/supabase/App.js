import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
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
            }
            catch (error) {
                console.error('Error fetching meds:', error.message);
            }
        };
        getMeds();
    }, []);
    return (_jsxs(SafeAreaView, { style: styles.container, children: [_jsx(Text, { style: styles.title, children: "Medication List" }), _jsx(FlatList, { data: meds, keyExtractor: (item) => item.id.toString(), renderItem: ({ item }) => (_jsxs(View, { style: styles.item, children: [_jsx(Text, { style: styles.medName, children: item.name }), _jsxs(Text, { style: styles.medDetails, children: [item.dose, " - ", item.frequency] })] })) })] }));
}
;
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
