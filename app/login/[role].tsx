import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { loginUser } from "../../services/authService";

export default function LoginScreen() {

  const router = useRouter();
  const { role } = useLocalSearchParams();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleLogin = async () => {

    try{

      const user = await loginUser(email,password);

      if(user.role === "owner"){
        router.replace("/owner/home");
      }else{
        router.replace("/tenant/home");
      }

    }catch(e){
      alert("Invalid Email or Password");
    }

  };

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        Login as {role}
      </Text>

      <TextInput
        placeholder="Email Address"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Pressable
        onPress={()=>router.push(`/register/${role}`)}
      >
        <Text style={styles.link}>
          No account? Register
        </Text>
      </Pressable>

    </View>

  );

}

const styles = StyleSheet.create({

  container:{
    flex:1,
    justifyContent:"center",
    padding:20
  },

  title:{
    fontSize:24,
    fontWeight:"bold",
    marginBottom:30,
    textAlign:"center"
  },

  input:{
    borderWidth:1,
    borderColor:"#ccc",
    padding:12,
    borderRadius:8,
    marginBottom:15
  },

  button:{
    backgroundColor:"#6C63FF",
    padding:14,
    borderRadius:8,
    alignItems:"center"
  },

  buttonText:{
    color:"white",
    fontSize:16,
    fontWeight:"bold"
  },

  link:{
    textAlign:"center",
    marginTop:20,
    color:"#6C63FF"
  }

});