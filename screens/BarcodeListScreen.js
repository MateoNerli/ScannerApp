import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as XLSX from "xlsx";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function BarcodeListScreen() {
  const [scannedData, setScannedData] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getData = async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue != null) {
        return JSON.parse(jsonValue);
      }
      return [];
    } catch (e) {
      console.error("Error reading data: ", e);
      return []; // Devuelve un array vacío en caso de error
    }
  };

  const loadData = async () => {
    try {
      const storedData = await getData("scanned_codes");
      console.log("Datos cargados: ", storedData);
      setScannedData(storedData); // Asigna los datos cargados al estado
    } catch (error) {
      console.error("Error al cargar los datos de AsyncStorage", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = filterDate
    ? scannedData.filter((item) => item.date.includes(filterDate))
    : scannedData;

  const clearData = () => {
    Alert.alert(
      "Confirmación",
      "¿Estás seguro de que deseas vaciar la lista?",
      [{ text: "Cancelar" }, { text: "Sí", onPress: clearAllData }]
    );
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.removeItem("scanned_codes");
      setScannedData([]); // Vacía el estado local
      Alert.alert("Éxito", "Los datos han sido borrados.");
    } catch (error) {
      console.error("Error al eliminar los datos de AsyncStorage", error);
    }
  };

  const exportToExcel = async () => {
    if (scannedData.length === 0) {
      Alert.alert("Aviso", "No hay datos para exportar.");
      return;
    }

    const workSheet = XLSX.utils.json_to_sheet(scannedData);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, "Barcodes");
    const excelFile = XLSX.write(workBook, {
      bookType: "xlsx",
      type: "binary",
    });

    const fileUri =
      FileSystem.documentDirectory + `barcodes_${scannedData}.xlsx`;
    await FileSystem.writeAsStringAsync(fileUri, excelFile, {
      encoding: FileSystem.EncodingType.Base64,
    });

    Alert.alert("Exportación exitosa", "El archivo Excel se ha guardado.");
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || filterDate;
    setShowDatePicker(false);
    setFilterDate(currentDate ? currentDate.toISOString().split("T")[0] : "");
  };

  const clearFilterDate = () => {
    setFilterDate("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            {filterDate
              ? `Fecha Seleccionada: ${filterDate}`
              : "Seleccionar Fecha"}
          </Text>
        </TouchableOpacity>
        {filterDate && (
          <TouchableOpacity
            onPress={clearFilterDate}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
        {showDatePicker && (
          <DateTimePicker
            value={filterDate ? new Date(filterDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Código: <Text style={styles.code}>{item.code}</Text>
            </Text>
            <Text style={styles.cardText}>
              Fecha: <Text style={styles.date}>{item.date}</Text>
            </Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No hay códigos guardados.</Text>
        )}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={clearData}>
          <Text style={styles.buttonText}>Vaciar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={exportToExcel}>
          <Text style={styles.buttonText}>Exportar a Excel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9fafb",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  dateContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    transition: "background-color 0.3s ease",
  },

  dateButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  dateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 18,
    color: "#555",
    marginBottom: 5,
  },
  code: {
    fontWeight: "bold",
    color: "#4a90e2",
  },
  date: {
    color: "#888",
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#4a90e2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 130,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
