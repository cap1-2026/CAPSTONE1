import AsyncStorage from "@react-native-async-storage/async-storage";

export const registerUser = async (user:any) => {

 const users = JSON.parse(await AsyncStorage.getItem("users") || "[]");

 const exists = users.find((u:any)=>u.email===user.email);

 if(exists){
   throw new Error("Email already exists");
 }

 const newUser={
   id:Date.now().toString(),
   ...user
 }

 users.push(newUser);

 await AsyncStorage.setItem("users",JSON.stringify(users));

 return newUser;
}


export const loginUser = async (email:string,password:string)=>{

 const users = JSON.parse(await AsyncStorage.getItem("users") || "[]");

 const user = users.find(
   (u:any)=>u.email===email && u.password===password
 )

 if(!user){
   throw new Error("Invalid Login")
 }

 await AsyncStorage.setItem("session",JSON.stringify(user))

 return user
}