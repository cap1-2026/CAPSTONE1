import AsyncStorage from "@react-native-async-storage/async-storage";

export const addProperty = async(property:any)=>{

 const properties = JSON.parse(
   await AsyncStorage.getItem("properties") || "[]"
 )

 const newProperty = {
   id:Date.now().toString(),
   ...property
 }

 properties.push(newProperty)

 await AsyncStorage.setItem("properties",JSON.stringify(properties))

 return newProperty
}


export const getProperties = async()=>{

 return JSON.parse(
   await AsyncStorage.getItem("properties") || "[]"
 )

}