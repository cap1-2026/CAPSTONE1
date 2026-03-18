import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert, FlatList, Image, Modal, Platform,
  ScrollView, StyleSheet, Switch, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import API_ENDPOINTS from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

// ─── Philippine Location Data ─────────────────────────────────────────────────
type PHData = Record<string, string[]>;

const PH_PROVINCES: PHData = {
  "Metro Manila (NCR)": ["Caloocan","Las Piñas","Makati","Malabon","Mandaluyong","Manila","Marikina","Muntinlupa","Navotas","Parañaque","Pasay","Pasig","Pateros","Quezon City","San Juan","Taguig","Valenzuela"],
  "Abra": ["Bangued","Bucay","Dolores","La Paz","Lagangilang","Langiden","Licuan-Baay","Luba","Manabo","Peñarrubia","Pidigan","Pilar","Sallapadan","San Isidro","San Juan","Tayum","Tineg","Tubo","Villaviciosa"],
  "Agusan del Norte": ["Butuan City","Cabadbaran City","Buenavista","Carmen","Jabonga","Kitcharao","Las Nieves","Magallanes","Nasipit","Santiago","Tubay"],
  "Agusan del Sur": ["Bayugan City","Bunawan","Esperanza","La Paz","Loreto","Prosperidad","San Francisco","San Luis","Santa Josefa","Sibagat","Talacogon","Trento"],
  "Aklan": ["Kalibo","Banga","Batan","Buruanga","Ibajay","Lezo","Libacao","Madalag","Malay","Nabas","New Washington","Numancia"],
  "Albay": ["Legazpi City","Tabaco City","Ligao City","Bacacay","Camalig","Daraga","Guinobatan","Jovellar","Libon","Malilipot","Polangui","Rapu-Rapu","Tiwi"],
  "Antique": ["San Jose","Anini-y","Barbaza","Belison","Bugasong","Caluya","Culasi","Hamtic","Laua-an","Libertad","Pandan","Sibalom","Tibiao","Valderrama"],
  "Apayao": ["Kabugao","Calanasan","Conner","Flora","Luna","Pudtol","Santa Marcela"],
  "Aurora": ["Baler","Casiguran","Dilasag","Dinalungan","Dingalan","Dipaculao","Maria Aurora","San Luis"],
  "Basilan": ["Isabela City","Lamitan City","Akbar","Al-Barka","Lantawan","Maluso","Sumisip","Tipo-Tipo","Tuburan"],
  "Bataan": ["Balanga City","Abucay","Bagac","Dinalupihan","Hermosa","Limay","Mariveles","Morong","Orani","Orion","Pilar","Samal"],
  "Batanes": ["Basco","Itbayat","Ivana","Mahatao","Sabtang","Uyugan"],
  "Batangas": ["Batangas City","Lipa City","Tanauan City","Agoncillo","Alitagtag","Balayan","Balete","Bauan","Calaca","Calatagan","Cuenca","Ibaan","Laurel","Lemery","Lian","Lobo","Mabini","Malvar","Mataas na Kahoy","Nasugbu","Padre Garcia","Rosario","San Jose","San Juan","Santa Teresita","Santo Tomas","Taal","Talisay","Taysan","Tuy"],
  "Benguet": ["Baguio City","La Trinidad","Atok","Bakun","Bokod","Buguias","Itogon","Kabayan","Kapangan","Kibungan","Mankayan","Sablan","Tuba","Tublay"],
  "Biliran": ["Naval","Almeria","Caibiran","Kawayan","Maripipi","San Isidro"],
  "Bohol": ["Tagbilaran City","Baclayon","Carmen","Corella","Dauis","Jagna","Loon","Panglao","Talibon","Trinidad","Tubigon","Ubay","Valencia"],
  "Bukidnon": ["Malaybalay City","Valencia City","Cagayan de Oro (partial)","Damulog","Don Carlos","Impasugong","Kadingilan","Kalilangan","Kibawe","Kitaotao","Lantapan","Libona","Magsaysay","Maramag","Pangantucan","Quezon","San Fernando","Sumilao","Talakag"],
  "Bulacan": ["Malolos City","Meycauayan City","San Jose del Monte City","Angat","Balagtas","Baliuag","Bocaue","Bulakan","Bustos","Calumpit","Guiguinto","Hagonoy","Marilao","Norzagaray","Obando","Pandi","Paombong","Plaridel","Pulilan","San Ildefonso","San Miguel","San Rafael","Santa Maria"],
  "Cagayan": ["Tuguegarao City","Abulug","Alcala","Aparri","Baggao","Ballesteros","Claveria","Enrile","Gattaran","Gonzaga","Iguig","Lal-lo","Lasam","Pamplona","Peñablanca","Piat","Rizal","Sanchez-Mira","Santa Ana","Santo Niño","Solana","Tuao"],
  "Camarines Norte": ["Daet","Basud","Capalonga","Jose Panganiban","Labo","Mercedes","Paracale","San Vicente","Santa Elena","Talisay","Vinzons"],
  "Camarines Sur": ["Naga City","Iriga City","Baao","Balatan","Bula","Buhi","Calabanga","Camaligan","Canaman","Goa","Pili","Ragay","San Fernando","Sipocot"],
  "Camiguin": ["Mambajao","Catarman","Guinsiliban","Mahinog","Sagay"],
  "Capiz": ["Roxas City","Cuartero","Dao","Dumalag","Dumarao","Ivisan","Jamindan","Mambusao","Panay","Pilar","Pontevedra","Sigma","Tapaz"],
  "Catanduanes": ["Virac","Bagamanoc","Baras","Bato","Caramoran","Gigmoto","Pandan","Panganiban","San Andres","San Miguel","Viga"],
  "Cavite": ["Bacoor City","Cavite City","Dasmariñas City","General Trias City","Imus City","Tagaytay City","Trece Martires City","Alfonso","Amadeo","Carmona","General Emilio Aguinaldo","Indang","Kawit","Magallanes","Maragondon","Mendez","Naic","Noveleta","Rosario","Silang","Tanza","Ternate"],
  "Cebu": ["Cebu City","Lapu-Lapu City","Mandaue City","Bogo City","Carcar City","Danao City","Naga City","Talisay City","Toledo City","Alcoy","Argao","Bantayan","Barili","Consolacion","Cordova","Dalaguete","Dumanjug","Ginatilan","Liloan","Madridejos","Minglanilla","Moalboal","Oslob","Pilar","Ronda","Samboan","San Fernando","San Remigio","Santa Fe","Santander","Sibonga","Sogod","Tabogon","Tuburan"],
  "Compostela Valley": ["Nabunturan","Compostela","Laak","Mabini","Maco","Maragusan","Mawab","Monkayo","Montevista","New Bataan","Pantukan"],
  "Cotabato (North Cotabato)": ["Kidapawan City","Alamada","Aleosan","Antipas","Arakan","Banisilan","Carmen","Kabacan","Libungan","Magpet","Makilala","Matalam","Midsayap","M'lang","Pigkawayan","Pikit","President Roxas","Tulunan"],
  "Davao del Norte": ["Tagum City","Panabo City","Asuncion","Braulio E. Dujali","Carmen","Kapalong","New Corella","Samal","San Isidro","Santo Tomas","Talaingod"],
  "Davao del Sur": ["Davao City","Digos City","Bansalan","Don Marcelino","Hagonoy","Jose Abad Santos","Kiblawan","Magsaysay","Malalag","Matanao","Padada","Santa Cruz","Sulop"],
  "Davao Occidental": ["Malita","Don Marcelino","Jose Abad Santos","Santa Maria","Sarangani"],
  "Davao Oriental": ["Mati City","Baganga","Banaybanay","Boston","Caraga","Cateel","Governor Generoso","Lupon","Manay","San Isidro","Tarragona"],
  "Dinagat Islands": ["San Jose","Basilisa","Cagdianao","Dinagat","Libjo","Loreto","Tubajon"],
  "Eastern Samar": ["Borongan City","Arteche","Balangiga","Balangkayan","Can-avid","Dolores","General MacArthur","Giporlos","Guiuan","Hernani","Jipapad","Lawaan","Llorente","Maslog","Maydolong","Mercedes","Oras","Quinapondan","Salcedo","San Julian","Taft"],
  "Guimaras": ["Jordan","Buenavista","Nueva Valencia","San Lorenzo","Sibunag"],
  "Ifugao": ["Lagawe","Alfonso Lista","Aguinaldo","Asipulo","Banaue","Hingyon","Hungduan","Kiangan","Lamut","Mayoyao","Tinoc"],
  "Ilocos Norte": ["Laoag City","Batac City","Adams","Bacarra","Badoc","Bangui","Banna","Burgos","Carasi","Currimao","Dingras","Dumalneg","Marcos","Pagudpud","Paoay","Pasuquin","Piddig","Pinili","San Nicolas","Sarrat","Solsona","Vintar"],
  "Ilocos Sur": ["Vigan City","Candon City","Alilem","Banayoyo","Bantay","Burgos","Cabugao","Caoayan","Cervantes","Galimuyod","Lidlidda","Magsingal","Narvacan","Salcedo","San Emilio","San Esteban","San Ildefonso","San Juan","Santa","Santa Catalina","Santa Cruz","Santa Lucia","Santa Maria","Santo Domingo","Sigay","Sinait","Suyo","Tagudin"],
  "Iloilo": ["Iloilo City","Passi City","Ajuy","Alimodian","Anilao","Badiangan","Balasan","Banate","Barotac Nuevo","Barotac Viejo","Batad","Bingawan","Cabatuan","Calinog","Carles","Concepcion","Dingle","Dueñas","Dumangas","Estancia","Guimbal","Igbaras","Janiuay","Lambunao","Leganes","Lemery","Leon","Maasin","Miagao","Mina","New Lucena","Oton","Pavia","Pototan","San Dionisio","San Enrique","San Joaquin","San Miguel","San Rafael","Santa Barbara","Sara","Tigbauan","Zarraga"],
  "Isabela": ["Ilagan City","Cauayan City","Santiago City","Alicia","Angadanan","Aurora","Benito Soliven","Burgos","Cabagan","Cabatuan","Cordon","Delfin Albano","Dinapigue","Divilacan","Echague","Gamu","Jones","Luna","Mallig","Naguilian","Palanan","Quezon","Quirino","Ramon","Reina Mercedes","Roxas","San Agustin","San Guillermo","San Isidro","San Manuel","San Mariano","San Mateo","San Pablo","Santa Maria","Santo Tomas","Tumauini"],
  "Kalinga": ["Tabuk City","Balbalan","Lubuagan","Pasil","Pinukpuk","Rizal","Tanudan","Tinglayan"],
  "La Union": ["San Fernando City","Agoo","Aringay","Bacnotan","Bagulin","Balaoan","Bangar","Bauang","Burgos","Caba","Luna","Naguilian","Pugo","Rosario","San Gabriel","San Juan","Santo Tomas","Santol","Sudipen","Tubao"],
  "Laguna": ["Calamba City","San Pablo City","Biñan City","Cabuyao City","Santa Rosa City","San Pedro City","Alaminos","Bay","Cavinti","Famy","Kalayaan","Liliw","Los Baños","Luisiana","Lumban","Mabitac","Magdalena","Majayjay","Nagcarlan","Paete","Pagsanjan","Pakil","Pangil","Pila","Rizal","Santa Cruz","Santa Maria","Siniloan","Victoria"],
  "Lanao del Norte": ["Iligan City","Bacolod","Baloi","Kapatagan","Kauswagan","Linamon","Magsaysay","Maigo","Munai","Nunungan","Pantao Ragat","Pantar","Poona Piagapo","Salvador","Sapad","Sultan Naga Dimaporo","Tagoloan","Tangkal"],
  "Lanao del Sur": ["Marawi City","Bayang","Binidayan","Butig","Ditsaan-Ramain","Maguing","Malabang","Masiu","Mulondo","Poona Bayabao","Sultan Gumander"],
  "Leyte": ["Tacloban City","Ormoc City","Baybay City","Abuyog","Alangalang","Albuera","Babatngon","Barugo","Bato","Burauen","Calubian","Capoocan","Carigara","Dagami","Dulag","Hilongos","Inopacan","Isabel","Jaro","La Paz","MacArthur","Mahaplag","Matag-ob","Merida","Palo","Palompon","Pastrana","San Isidro","San Miguel","Santa Fe","Tabango","Tolosa","Tunga","Villaba"],
  "Maguindanao": ["Cotabato City","Ampatuan","Barira","Buldon","Buluan","Datu Abdullah Sangki","Datu Blah T. Sinsuat","Datu Odin Sinsuat","Datu Paglas","Datu Piang","Datu Salibo","General Salipada K. Pendatun","Guindulungan","Kabuntalan","Mamasapano","Mangudadatu","Matanog","Northern Kabuntalan","Pagalungan","Paglat","Pandag","Parang","Rajah Buayan","Shariff Aguak","Sultan Kudarat","Sultan Mastura","Talayan","Upi"],
  "Marinduque": ["Boac","Buenavista","Gasan","Mogpog","Santa Cruz","Torrijos"],
  "Masbate": ["Masbate City","Aroroy","Baleno","Balud","Batuan","Cataingan","Cawayan","Claveria","Dimasalang","Esperanza","Mandaon","Milagros","Mobo","Monreal","Palanas","Placer","San Fernando","San Jacinto","San Pascual","Uson"],
  "Misamis Occidental": ["Oroquieta City","Ozamiz City","Tangub City","Aloran","Baliangao","Bonifacio","Calamba","Clarin","Concepcion","Don Victoriano Chiongbian","Jimenez","Lopez Jaena","Panaon","Plaridel","Sapang Dalaga","Sinacaban","Tudela"],
  "Misamis Oriental": ["Cagayan de Oro City","Gingoog City","El Salvador City","Alubijid","Balingasag","Balingoan","Binuangan","Claveria","Gitagum","Initao","Jasaan","Kinoguitan","Lagonglong","Laguindingan","Libertad","Lugait","Magsaysay","Manticao","Medina","Naawan","Opol","Salay","Sugbongcogon","Tagoloan","Talisayan","Villanueva"],
  "Mountain Province": ["Bontoc","Barlig","Bauko","Besao","Natonin","Paracelis","Sabangan","Sadanga","Sagada","Tadian"],
  "Negros Occidental": ["Bacolod City","Bago City","Cadiz City","Escalante City","Himamaylan City","Kabankalan City","La Carlota City","Sagay City","San Carlos City","Silay City","Sipalay City","Victorias City","Binalbagan","Calatrava","Candoni","Cauayan","Enrique B. Magalona","Hinigaran","Hinoba-an","Ilog","Isabela","La Castellana","Manapla","Moises Padilla","Murcia","Pontevedra","Pulupandan","Salvador Benedicto","San Enrique","Toboso","Valladolid"],
  "Negros Oriental": ["Dumaguete City","Bais City","Bayawan City","Canlaon City","Guihulngan City","Tanjay City","Amlan","Ayungon","Bacong","Basay","Bindoy","Dauin","Jimalalud","La Libertad","Mabinay","Manjuyod","Pamplona","San Jose","Santa Catalina","Siaton","Sibulan","Tayasan","Valencia","Vallehermoso","Zamboanguita"],
  "Northern Samar": ["Catarman","Allen","Biri","Bobon","Capul","Catubig","Gamay","Laoang","Lapinig","Las Navas","Lavezares","Lope de Vega","Mapanas","Mondragon","Palapag","Pambujan","Rosario","San Antonio","San Isidro","San Jose","San Vicente","Silvino Lobos","Victoria"],
  "Nueva Ecija": ["Cabanatuan City","Gapan City","Muñoz City","Palayan City","San Jose City","Aliaga","Bongabon","Cabiao","Carranglan","Cuyapo","Gabaldon","General Mamerto Natividad","General Tinio","Guimba","Jaen","Laur","Licab","Llanera","Lupao","Nampicuan","Pantabangan","Peñaranda","Quezon","Rizal","San Antonio","San Isidro","San Leonardo","Santa Rosa","Santo Domingo","Talavera","Talugtug","Zaragoza"],
  "Nueva Vizcaya": ["Bayombong","Alfonso Castañeda","Ambaguio","Aritao","Bagabag","Bambang","Diadi","Dupax del Norte","Dupax del Sur","Kasibu","Kayapa","Quezon","Santa Fe","Solano","Villaverde"],
  "Occidental Mindoro": ["Mamburao","Abra de Ilog","Calintaan","Looc","Lubang","Magsaysay","Paluan","Rizal","Sablayan","San Jose","Santa Cruz"],
  "Oriental Mindoro": ["Calapan City","Baco","Bansud","Bongabong","Bulalacao","Gloria","Mansalay","Naujan","Pinamalayan","Pola","Puerto Galera","Roxas","San Teodoro","Socorro","Victoria"],
  "Palawan": ["Puerto Princesa City","Brooke's Point","Coron","El Nido","Roxas","Taytay","Aborlan","Agutaya","Araceli","Balabac","Bataraza","Buliluyan","Cagayancillo","Culion","Cuyo","Dumaran","Española","Linapacan","Magsaysay","Narra","Quezon","Rizal","San Vicente"],
  "Pampanga": ["Angeles City","San Fernando City","Mabalacat City","Apalit","Arayat","Bacolor","Candaba","Floridablanca","Guagua","Lubao","Macabebe","Magalang","Masantol","Mexico","Minalin","Porac","San Luis","San Simon","Santa Ana","Santa Rita","Santo Tomas","Sasmuan"],
  "Pangasinan": ["Dagupan City","Alaminos City","San Carlos City","Urdaneta City","Agno","Aguilar","Alcala","Anda","Asingan","Balungao","Bani","Basista","Bautista","Bayambang","Binalonan","Binmaley","Bolinao","Bugallon","Burgos","Calasiao","Dasol","Infanta","Labrador","Laoac","Lingayen","Mabini","Malasiqui","Manaoag","Mangaldan","Mangatarem","Mapandan","Natividad","Pozorrubio","Rosales","San Fabian","San Jacinto","San Manuel","San Nicolas","San Quintin","Santa Barbara","Santa Maria","Santo Tomas","Sison","Sual","Tayug","Umingan","Urbiztondo","Villasis"],
  "Quezon": ["Lucena City","Tayabas City","Agdangan","Alabat","Atimonan","Buenavista","Calauag","Candelaria","Catanauan","Dolores","General Luna","General Nakar","Guinayangan","Gumaca","Infanta","Jomalig","Lopez","Lucban","Macalelon","Mauban","Mulanay","Padre Burgos","Pagbilao","Panukulan","Patnanungan","Perez","Pitogo","Plaridel","Quezon","Real","Sampaloc","San Andres","San Antonio","San Francisco","San Narciso","Sariaya","Tagkawayan","Tiaong","Unisan"],
  "Quirino": ["Cabarroguis","Aglipay","Diffun","Maddela","Nagtipunan","Saguday"],
  "Rizal": ["Antipolo City","Angono","Baras","Binangonan","Cainta","Cardona","Jala-jala","Morong","Pililla","Rodriguez","San Mateo","Tanay","Taytay","Teresa"],
  "Romblon": ["Romblon","Alcantara","Banton","Cajidiocan","Calatrava","Concepcion","Corcuera","Ferrol","Looc","Magdiwang","Odiongan","San Agustin","San Andres","San Fernando","San Jose","Santa Fe","Santa Maria"],
  "Samar": ["Catbalogan City","Calbayog City","Almagro","Basey","Calbiga","Daram","Gandara","Hinabangan","Jiabong","Marabut","Matuguinao","Motiong","Pagsanghan","Paranas","Pinabacdao","San Jorge","San Jose de Buan","San Sebastian","Santa Rita","Santo Niño","Tagapul-an","Talalora","Tarangnan","Villareal","Zumarraga"],
  "Sarangani": ["Alabel","Glan","Kiamba","Maasim","Maitum","Malapatan","Malungon"],
  "Siquijor": ["Siquijor","Enrique Villanueva","Larena","Lazi","Maria","San Juan"],
  "Sorsogon": ["Sorsogon City","Barcelona","Bulan","Bulusan","Casiguran","Castilla","Donsol","Gubat","Irosin","Juban","Magallanes","Matnog","Pilar","Prieto Diaz","Santa Magdalena"],
  "South Cotabato": ["Koronadal City","General Santos City","Banga","Lake Sebu","Norala","Polomolok","Santo Niño","Surallah","T'boli","Tampakan","Tantangan","Tupi"],
  "Southern Leyte": ["Maasin City","Anahawan","Bontoc","Hinunangan","Hinundayan","Libagon","Liloan","Limasawa","Macrohon","Malitbog","Padre Burgos","Pintuyan","Saint Bernard","San Francisco","San Juan","San Ricardo","Silago","Sogod","Tomas Oppus"],
  "Sultan Kudarat": ["Isulan","Bagumbayan","Columbio","Esperanza","Kalamansig","Lambayong","Lebak","Lutayan","Palimbang","President Quirino","Sen. Ninoy Aquino","Sultan Kudarat"],
  "Sulu": ["Jolo","Hadji Panglima Tahil","Indanan","Kalingalan Caluang","Lugus","Luuk","Maimbung","Old Panamao","Omar","Pandami","Panglima Estino","Pangutaran","Parang","Pata","Patikul","Siasi","Talipao","Tapul","Tongkil"],
  "Surigao del Norte": ["Surigao City","Alegria","Bacuag","Burgos","Claver","Dapa","Del Carmen","General Luna","Gigaquit","Mainit","Malimono","Pilar","Placer","San Benito","San Francisco","San Isidro","Santa Monica","Sison","Socorro","Tagana-an","Tubod"],
  "Surigao del Sur": ["Tandag City","Bislig City","Barobo","Bayabas","Cagwait","Cantilan","Carmen","Carrascal","Cortes","Hinatuan","Lanuza","Lianga","Lingig","Madrid","Marihatag","San Agustin","San Miguel","Tagbina","Tago"],
  "Tawi-Tawi": ["Bongao","Languyan","Mapun","Panglima Sugala","Sapa-Sapa","Sibutu","Simunul","Sitangkai","South Ubian","Tandubas","Turtle Islands"],
  "Zambales": ["Olongapo City","Botolan","Cabangan","Candelaria","Castillejos","Iba","Masinloc","Palauig","San Antonio","San Felipe","San Marcelino","San Narciso","Santa Cruz","Subic"],
  "Zamboanga del Norte": ["Dapitan City","Dipolog City","Baliguian","Godod","Gutalac","Jose Dalman","Kalawit","Katipunan","La Libertad","Labason","Liloy","Manukan","Mutia","Piñan","Polanco","Pres. Manuel A. Roxas","Rizal","Salug","Sergio Osmeña Sr.","Siayan","Sibuco","Sibutad","Sindangan","Siocon","Sirawai","Tampilisan"],
  "Zamboanga del Sur": ["Pagadian City","Zamboanga City","Aurora","Bayog","Dimataling","Dinas","Dumalinao","Dumingag","Guipos","Josefina","Kumalarang","Labangan","Lakewood","Lapuyan","Mahayag","Margosatubig","Midsalip","Molave","Pitogo","Ramon Magsaysay","San Miguel","San Pablo","Tabina","Tambulig","Tigbao","Tukuran","Tungawan"],
  "Zamboanga Sibugay": ["Ipil","Alicia","Buug","Diplahan","Imelda","Kabasalan","Mabuhay","Malangas","Naga","Olutanga","Payao","Roseller T. Lim","Siay","Talusan","Titay","Tungawan"],
};

const PROVINCE_NAMES = Object.keys(PH_PROVINCES).sort();

const PARKING_TYPES = [
  { id: "motorcycle", label: "Motorcycle" },
  { id: "4wheels",    label: "4 Wheels"   },
  { id: "6wheels",    label: "6 Wheels"   },
];

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ value, onChange, min = 0, max = 99 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <View style={sp.stepRow}>
      <TouchableOpacity style={sp.stepBtn} onPress={() => onChange(Math.max(min, value - 1))}>
        <Text style={sp.stepBtnTxt}>−</Text>
      </TouchableOpacity>
      <TextInput
        style={sp.stepInput}
        value={String(value)}
        onChangeText={(t) => { const n = parseInt(t.replace(/\D/g, ""), 10); if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n))); }}
        keyboardType="number-pad"
        textAlign="center"
      />
      <TouchableOpacity style={sp.stepBtn} onPress={() => onChange(Math.min(max, value + 1))}>
        <Text style={sp.stepBtnTxt}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Search-dropdown Modal ────────────────────────────────────────────────────
function SearchModal({ visible, title, items, onSelect, onClose }: {
  visible: boolean; title: string; items: string[];
  onSelect: (v: string) => void; onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered  = q ? items.filter(i => i.toLowerCase().includes(q.toLowerCase())) : items;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={sp.modalOverlay}>
        <View style={sp.modalBox}>
          <View style={sp.modalHeader}>
            <Text style={sp.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Text style={sp.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <TextInput style={sp.modalSearch} placeholder={`Search ${title.toLowerCase()}…`} value={q} onChangeText={setQ} placeholderTextColor="#9CA3AF" />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={sp.modalItem} onPress={() => { onSelect(item); setQ(""); onClose(); }}>
                <Text style={sp.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OwnerApply() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [editId, setEditId]           = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Owner info
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idFile, setIdFile]             = useState<any>(null);
  const [ownershipFile, setOwnershipFile] = useState<any>(null);
  const [agree, setAgree] = useState(false);

  // Property Details
  const [propertyTitle, setPropertyTitle]             = useState("");
  const [propertyType, setPropertyType]               = useState("");
  const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false);
  const [monthlyRent, setMonthlyRent]                 = useState("");
  const [securityDeposit, setSecurityDeposit]         = useState("");
  const depositOverRent = !!monthlyRent && !!securityDeposit &&
    Number(securityDeposit) > Number(monthlyRent);

  // Location
  const [address, setAddress]     = useState("");
  const [barangay, setBarangay]   = useState("");
  const [city, setCity]           = useState("");
  const [province, setProvince]   = useState("");
  const [landmark, setLandmark]   = useState("");
  const [showProvModal, setShowProvModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const availableCities = province ? (PH_PROVINCES[province] ?? []) : [];

  // Specifications
  const [bedrooms, setBedrooms]   = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [floorArea, setFloorArea] = useState("");
  const [description, setDescription] = useState("");

  // Property Images
  const [propertyImages, setPropertyImages] = useState<any[]>([]);

  // Amenities
  const [hasParking, setHasParking]       = useState(false);
  const [parkingTypes, setParkingTypes]   = useState<string[]>([]);
  const [hasWifi, setHasWifi]             = useState(false);
  const [hasWater, setHasWater]           = useState(false);
  const [hasElectricity, setHasElectricity] = useState(false);
  const [hasAircon, setHasAircon]         = useState(false);
  const [hasFurnished, setHasFurnished]   = useState(false);
  const [hasSecurity, setHasSecurity]     = useState(false);
  const [hasElevator, setHasElevator]     = useState(false);

  // Toggle a parking type in/out of the selection
  function toggleParking(id: string) {
    setParkingTypes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }

  // Pre-fill owner info from session
  useEffect(() => {
    UserStorage.getUser("owner").then((u) => {
      if (u) { setName(u.fullname); setEmail(u.email); }
    });
  }, []);

  // Load existing property data when editing
  useEffect(() => {
    const id = params.id ? Number(params.id) : null;
    if (!id || isNaN(id)) return;
    setEditId(id);
    fetch(`${API_ENDPOINTS.GET_PROPERTIES}?property_id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.status !== "success") return;
        const p = data.data;
        setPropertyTitle(p.name || "");
        setPropertyType(p.property_type || "");
        setMonthlyRent(p.price ? String(Math.round(parseFloat(p.price))) : "");
        setSecurityDeposit(p.deposit ? String(Math.round(parseFloat(p.deposit))) : "");
        setAddress(p.address || "");
        setBedrooms(p.rooms ? parseInt(p.rooms) : 1);
        setFloorArea(p.room_size || "");
        setDescription(p.rules || "");
        if (p.lease_duration) setLeaseDuration(p.lease_duration);
        const am = (p.amenities || "").toLowerCase();
        setHasWifi(am.includes("wifi"));
        setHasWater(am.includes("water"));
        setHasElectricity(am.includes("electricity"));
        setHasAircon(am.includes("aircon") || am.includes("air con"));
        setHasFurnished(am.includes("furnished"));
        setHasSecurity(am.includes("security"));
        setHasElevator(am.includes("elevator"));
        setHasParking(am.includes("parking"));
        const pt: string[] = [];
        if (am.includes("motorcycle")) pt.push("motorcycle");
        if (am.includes("4 wheel") || am.includes("4wheel")) pt.push("4wheels");
        if (am.includes("6 wheel") || am.includes("6wheel")) pt.push("6wheels");
        setParkingTypes(pt);
      })
      .catch(() => {});
  }, [params.id]);

  async function pickDocumentImage(setter: (f: any) => void) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission Required", "Please allow access to your photo library."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images" as any, allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setter(result.assets[0]);
  }

  async function pickPropertyImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission Required", "Please allow access to your photo library."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPropertyImages(prev => [...prev, ...result.assets]);
    }
  }

  function removeImage(index: number) {
    setPropertyImages(prev => prev.filter((_, i) => i !== index));
  }

  // Upload a single image — works on both web and native
  async function uploadImage(propertyId: number, img: any) {
    const imgForm = new FormData();
    imgForm.append("property_id", String(propertyId));

    if (Platform.OS === "web") {
      // Web: img.uri is a blob: URL — fetch it to get binary
      const blobRes  = await fetch(img.uri);
      const blob     = await blobRes.blob();
      const fileName = img.fileName || `photo_${Date.now()}.jpg`;
      const file     = new File([blob], fileName, { type: blob.type || "image/jpeg" });
      imgForm.append("image", file, fileName);
    } else {
      // Native (Android / iOS): append as uri object
      const fileName = img.fileName || img.uri.split("/").pop() || `photo_${Date.now()}.jpg`;
      const mimeType = img.mimeType || img.type || "image/jpeg";
      (imgForm as any).append("image", { uri: img.uri, name: fileName, type: mimeType });
    }

    await fetch(API_ENDPOINTS.UPLOAD_IMAGES, { method: "POST", body: imgForm });
  }

  function validate() {
    if (!propertyTitle.trim()) { Alert.alert("Missing Information", "Please enter a property title."); return false; }
    if (!monthlyRent.trim()) { Alert.alert("Missing Information", "Please enter the monthly rent."); return false; }
    if (!address.trim() || !city.trim()) { Alert.alert("Missing Information", "Please enter the property address and city."); return false; }
    return true;
  }

  async function submit() {
    if (!validate()) return;
    const user    = await UserStorage.getUser("owner");
    const ownerId = user?.user_id ?? 1;
    setIsSubmitting(true);
    try {
      const amenityList: string[] = [];
      if (hasWifi)        amenityList.push("WiFi");
      if (hasWater)       amenityList.push("Water");
      if (hasElectricity) amenityList.push("Electricity");
      if (hasAircon)      amenityList.push("Aircon");
      if (hasFurnished)   amenityList.push("Furnished");
      if (hasSecurity)    amenityList.push("Security");
      if (hasElevator)    amenityList.push("Elevator");
      if (hasParking && parkingTypes.length > 0) {
        const labels = PARKING_TYPES.filter(p => parkingTypes.includes(p.id)).map(p => p.label);
        amenityList.push(`Parking(${labels.join(", ")})`);
      } else if (hasParking) {
        amenityList.push("Parking");
      }

      const fullAddress = [address, barangay, city, province, landmark].filter(Boolean).join(", ");

      const body = {
        property_name:  propertyTitle,
        property_type:  propertyType || "Apartment",
        address:        fullAddress,
        rooms:          bedrooms,
        room_size:      floorArea,
        max_occupants:  1,
        amenities:      amenityList.join(", "),
        price:          parseFloat(monthlyRent) || 0,
        deposit:        parseFloat(securityDeposit) || parseFloat(monthlyRent) || 0,
        rules:          description,
        lease_duration: "1 Year",
      };

      let propertyId: number;
      if (editId) {
        const res  = await fetch(API_ENDPOINTS.UPDATE_PROPERTY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, property_id: editId }) });
        const data = await res.json();
        if (data.status !== "success" && data.status !== "info") { Alert.alert("Failed", data.message || "Could not update property."); setIsSubmitting(false); return; }
        propertyId = editId;
      } else {
        const res  = await fetch(API_ENDPOINTS.ADD_PROPERTY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, owner_id: ownerId }) });
        const data = await res.json();
        if (data.status !== "success") { Alert.alert("Failed", data.message || "Could not save property."); setIsSubmitting(false); return; }
        propertyId = data.property_id;
      }

      for (const img of propertyImages) {
        try { await uploadImage(propertyId, img); } catch (_) {}
      }

      setIsSubmitting(false);
      Alert.alert(editId ? "Property Updated!" : "Property Submitted!", editId ? "Your property has been updated successfully." : "Your property has been submitted for review.");
      router.replace("/owner/properties");
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert("Error", "Failed to submit. Please check your connection and try again.");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Location search modals */}
      <SearchModal
        visible={showProvModal}
        title="Province / Region"
        items={PROVINCE_NAMES}
        onSelect={(v) => { setProvince(v); setCity(""); }}
        onClose={() => setShowProvModal(false)}
      />
      <SearchModal
        visible={showCityModal}
        title="City / Municipality"
        items={availableCities}
        onSelect={setCity}
        onClose={() => setShowCityModal(false)}
      />

      {/* ── OWNER INFO ─────────────────────────────── */}
      <Text style={styles.sectionTitle}>Owner Information</Text>

      <Text style={styles.label}>Full Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Juan Dela Cruz" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Email Address *</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="juan@example.com" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Phone Number *</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+63 912 345 6789" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Government-Issued ID *</Text>
      <TouchableOpacity style={[styles.upload, idFile && styles.uploadDone]} onPress={() => pickDocumentImage(setIdFile)}>
        {idFile ? (
          <View style={styles.docPreviewRow}>
            <Image source={{ uri: idFile.uri }} style={styles.docPreview} />
            <View style={styles.docPreviewInfo}>
              <Text style={styles.docPreviewDone}>✓ ID Uploaded</Text>
              <Text style={styles.docPreviewChange}>Tap to change</Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.uploadText}>📷  Tap to upload Government ID</Text>
            <Text style={styles.hint}>JPG, PNG — Driver's License, Passport, National ID</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Proof of Property Ownership *</Text>
      <TouchableOpacity style={[styles.upload, ownershipFile && styles.uploadDone]} onPress={() => pickDocumentImage(setOwnershipFile)}>
        {ownershipFile ? (
          <View style={styles.docPreviewRow}>
            <Image source={{ uri: ownershipFile.uri }} style={styles.docPreview} />
            <View style={styles.docPreviewInfo}>
              <Text style={styles.docPreviewDone}>✓ Ownership Doc Uploaded</Text>
              <Text style={styles.docPreviewChange}>Tap to change</Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.uploadText}>📷  Tap to upload Ownership Document</Text>
            <Text style={styles.hint}>JPG, PNG — Land title, tax declaration</Text>
          </>
        )}
      </TouchableOpacity>

      {/* ── PROPERTY DETAILS ───────────────────────── */}
      <Text style={styles.sectionTitle}>Property Details</Text>

      <Text style={styles.label}>Property Title *</Text>
      <TextInput style={styles.input} value={propertyTitle} onChangeText={setPropertyTitle} placeholder="Modern 2BR Apartment" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Property Type *</Text>
      <TouchableOpacity style={styles.dropdownSelector} onPress={() => setShowPropertyTypeDropdown(!showPropertyTypeDropdown)}>
        <Text style={[styles.dropdownSelectorText, !propertyType && styles.dropdownPlaceholder]}>{propertyType || "Select property type"}</Text>
        <Text style={styles.dropdownArrow}>{showPropertyTypeDropdown ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {showPropertyTypeDropdown && (
        <View style={styles.quickSelect}>
          {["Apartment", "Condominium", "Dormitory", "Transient"].map((type) => (
            <TouchableOpacity key={type} style={[styles.quickSelectButton, propertyType === type && styles.quickSelectButtonActive]}
              onPress={() => { setPropertyType(type); setShowPropertyTypeDropdown(false); }}>
              <Text style={[styles.quickSelectButtonText, propertyType === type && styles.quickSelectButtonTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Monthly Rent */}
      <Text style={styles.label}>Monthly Rent (₱) *</Text>
      <TextInput style={styles.input} value={monthlyRent} onChangeText={(t) => setMonthlyRent(t.replace(/[^0-9]/g, ""))} keyboardType="numeric" placeholder="15000" placeholderTextColor="#9CA3AF" />

      {/* Security Deposit */}
      <Text style={styles.label}>Security Deposit (₱) *</Text>
      <TextInput
        style={[styles.input, depositOverRent && styles.inputError]}
        value={securityDeposit}
        onChangeText={(t) => setSecurityDeposit(t.replace(/[^0-9]/g, ""))}
        keyboardType="numeric"
        placeholder="e.g. 5000 — how much tenant pays upfront"
        placeholderTextColor="#9CA3AF"
      />
      {depositOverRent && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️  Security Deposit (₱{Number(securityDeposit).toLocaleString()}) is higher than Monthly Rent (₱{Number(monthlyRent).toLocaleString()}). Please double-check your amounts.</Text>
        </View>
      )}

      {/* ── LOCATION ───────────────────────────────── */}
      <Text style={styles.sectionTitle}>Location</Text>

      <Text style={styles.label}>Province / Region *</Text>
      <TouchableOpacity style={styles.dropdownSelector} onPress={() => setShowProvModal(true)}>
        <Text style={[styles.dropdownSelectorText, !province && styles.dropdownPlaceholder]}>{province || "e.g. Metro Manila (NCR), Cebu, Davao del Sur…"}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Text style={styles.label}>City / Municipality *</Text>
      <TouchableOpacity
        style={[styles.dropdownSelector, !province && styles.dropdownDisabled]}
        onPress={() => { if (!province) Alert.alert("Select Province First", "Please select a province/region first."); else setShowCityModal(true); }}
      >
        <Text style={[styles.dropdownSelectorText, !city && styles.dropdownPlaceholder]}>{city || (province ? "Select city…" : "Select province first")}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Barangay</Text>
      <TextInput style={styles.input} value={barangay} onChangeText={setBarangay} placeholder="e.g. Barangay Holy Spirit, Brgy. 1, Poblacion…" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Street Address *</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="123 Rizal Street, Unit 2A" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Nearby Landmark</Text>
      <TextInput style={styles.input} value={landmark} onChangeText={setLandmark} placeholder="Near SM Mall, LRT Station, etc." placeholderTextColor="#9CA3AF" />

      {/* ── PROPERTY SPECIFICATIONS ────────────────── */}
      <Text style={styles.sectionTitle}>Property Specifications</Text>

      <Text style={styles.label}>Number of Bedrooms *</Text>
      <Stepper value={bedrooms} onChange={setBedrooms} min={0} max={99} />

      <Text style={[styles.label, { marginTop: 16 }]}>Number of Bathrooms *</Text>
      <Stepper value={bathrooms} onChange={setBathrooms} min={0} max={99} />

      <Text style={[styles.label, { marginTop: 16 }]}>Floor Area (sq.m)</Text>
      <TextInput style={styles.input} value={floorArea} onChangeText={(t) => setFloorArea(t.replace(/[^0-9]/g, ""))} keyboardType="numeric" placeholder="45" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Property Description</Text>
      <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe your property, its features, house rules…" placeholderTextColor="#9CA3AF" multiline numberOfLines={4} />

      {/* ── AMENITIES ──────────────────────────────── */}
      <Text style={styles.sectionTitle}>Amenities</Text>

      <View style={styles.rowCenter}>
        <Switch value={hasParking} onValueChange={(v) => { setHasParking(v); if (!v) setParkingTypes([]); }} />
        <Text style={styles.amenityText}>Parking</Text>
      </View>

      {hasParking && (
        <View style={styles.parkingOptions}>
          <Text style={styles.parkingLabel}>Select parking type (multi-select):</Text>
          <View style={styles.parkingButtonContainer}>
            {PARKING_TYPES.map((pt) => {
              const active = parkingTypes.includes(pt.id);
              return (
                <TouchableOpacity
                  key={pt.id}
                  style={[styles.parkingButton, active && styles.parkingButtonActive]}
                  onPress={() => toggleParking(pt.id)}
                >
                  <Text style={[styles.parkingButtonText, active && styles.parkingButtonTextActive]}>
                    {active ? "✓ " : ""}{pt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {parkingTypes.length > 0 && (
            <Text style={styles.parkingSelected}>
              Selected: {PARKING_TYPES.filter(p => parkingTypes.includes(p.id)).map(p => p.label).join(", ")}
            </Text>
          )}
        </View>
      )}

      {[
        { state: hasWifi,        set: setHasWifi,        label: "WiFi"              },
        { state: hasWater,       set: setHasWater,       label: "Water Supply"       },
        { state: hasElectricity, set: setHasElectricity, label: "Electricity"        },
        { state: hasAircon,      set: setHasAircon,      label: "Air Conditioning"   },
        { state: hasFurnished,   set: setHasFurnished,   label: "Furnished"          },
        { state: hasSecurity,    set: setHasSecurity,    label: "Security / Guard"   },
        { state: hasElevator,    set: setHasElevator,    label: "Elevator"           },
      ].map(({ state, set, label }) => (
        <View key={label} style={styles.rowCenter}>
          <Switch value={state} onValueChange={set} />
          <Text style={styles.amenityText}>{label}</Text>
        </View>
      ))}

      {/* ── PROPERTY IMAGES ─────────────────────────── */}
      <Text style={styles.sectionTitle}>Property Images</Text>
      <Text style={styles.hint}>Add clear photos of your property. Images are shown to tenants on both mobile and web.</Text>
      <TouchableOpacity style={styles.upload} onPress={pickPropertyImage}>
        <Text style={styles.uploadText}>+ Add Property Photos</Text>
        <Text style={styles.hint}>JPG, PNG — tap to select from gallery</Text>
      </TouchableOpacity>

      {propertyImages.length > 0 && (
        <View style={styles.imagePreviewRow}>
          {propertyImages.map((img, index) => (
            <View key={index} style={styles.imagePreviewWrapper}>
              <Image
                source={{ uri: img.uri }}
                style={styles.imagePreview}
                resizeMode="cover"
                onError={() => {/* silent */ }}
              />
              <View style={styles.imagePreviewOverlay}>
                <Text style={styles.imagePreviewLabel} numberOfLines={1}>
                  {img.fileName || `Photo ${index + 1}`}
                </Text>
              </View>
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* ── AGREEMENT ───────────────────────────────── */}
      <View style={[styles.rowCenter, { marginTop: 20 }]}>
        <Switch value={agree} onValueChange={setAgree} />
        <Text style={styles.agreeText}> I agree to the terms and conditions and management contract. I certify that all information provided is accurate and I am the legal owner of the property.</Text>
      </View>

      <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={submit} disabled={isSubmitting}>
        <Text style={styles.buttonText}>{isSubmitting ? "Saving…" : editId ? "Save Changes" : "Submit Application"}</Text>
      </TouchableOpacity>

      <View style={styles.whatsNext}>
        <Text style={styles.sectionTitle}>What happens next?</Text>
        <Text style={styles.bullet}>• Your application will be reviewed within 2-3 business days</Text>
        <Text style={styles.bullet}>• We'll verify your identity and ownership documents</Text>
        <Text style={styles.bullet}>• You'll receive a notification about your application status</Text>
        <Text style={styles.bullet}>• Once approved, tenants can browse and book your property</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:                { padding: 20 },
  sectionTitle:             { fontSize: 18, fontWeight: "600", marginTop: 20, marginBottom: 8, color: "#007AFF" },
  label:                    { marginTop: 12, fontSize: 14, fontWeight: "500" },
  input:                    { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 6, marginTop: 6, backgroundColor: "#fff", color: "#111" },
  inputError:               { borderColor: "#DC2626" },
  errorBanner:              { marginTop: 6, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 8, padding: 10 },
  errorBannerText:          { color: "#DC2626", fontSize: 13, fontWeight: "500" },
  dropdownSelector:         { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 6, marginTop: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff" },
  dropdownDisabled:         { backgroundColor: "#F1F5F9", opacity: 0.7 },
  dropdownSelectorText:     { fontSize: 14, color: "#333", flex: 1 },
  dropdownPlaceholder:      { color: "#999" },
  dropdownArrow:            { color: "#007AFF", fontSize: 14, fontWeight: "600", marginLeft: 8 },
  quickSelect:              { flexDirection: "column", marginTop: 8, marginBottom: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, overflow: "hidden" },
  quickSelectButton:        { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  quickSelectButtonActive:  { backgroundColor: "#007AFF" },
  quickSelectButtonText:    { fontSize: 14, fontWeight: "500", color: "#333", textAlign: "center" },
  quickSelectButtonTextActive: { color: "#fff" },
  textArea:                 { minHeight: 100, textAlignVertical: "top" },
  upload:                   { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 6, marginTop: 6 },
  uploadDone:               { borderColor: "#4CAF50", backgroundColor: "#f0fff4" },
  uploadText:               { fontSize: 14 },
  hint:                     { fontSize: 12, color: "#666", marginTop: 4 },
  docPreviewRow:            { flexDirection: "row", alignItems: "center", gap: 12 },
  docPreview:               { width: 64, height: 64, borderRadius: 6, backgroundColor: "#eee" },
  docPreviewInfo:           { flex: 1 },
  docPreviewDone:           { fontSize: 14, fontWeight: "700", color: "#4CAF50" },
  docPreviewChange:         { fontSize: 12, color: "#888", marginTop: 2 },
  imagePreviewRow:          { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  imagePreviewWrapper:      { position: "relative", width: 110, height: 110 },
  imagePreview:             { width: 110, height: 110, borderRadius: 8, backgroundColor: "#eee" },
  imagePreviewOverlay:      { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.45)", borderBottomLeftRadius: 8, borderBottomRightRadius: 8, paddingHorizontal: 4, paddingVertical: 3 },
  imagePreviewLabel:        { color: "#fff", fontSize: 9 },
  removeImageBtn:           { position: "absolute", top: -6, right: -6, backgroundColor: "#ff3b30", borderRadius: 10, width: 22, height: 22, alignItems: "center", justifyContent: "center", zIndex: 10 },
  removeImageText:          { color: "#fff", fontSize: 11, fontWeight: "700" },
  rowCenter:                { flexDirection: "row", alignItems: "center", marginTop: 12 },
  agreeText:                { flex: 1, marginLeft: 8, fontSize: 13 },
  amenityText:              { marginLeft: 8, fontSize: 14 },
  parkingOptions:           { marginLeft: 40, marginTop: 8, marginBottom: 8 },
  parkingLabel:             { fontSize: 13, color: "#444", marginBottom: 8, fontWeight: "500" },
  parkingButtonContainer:   { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  parkingButton:            { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#f9f9f9" },
  parkingButtonActive:      { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  parkingButtonText:        { fontSize: 13, color: "#333" },
  parkingButtonTextActive:  { color: "#fff", fontWeight: "600" },
  parkingSelected:          { marginTop: 6, fontSize: 12, color: "#007AFF", fontWeight: "500" },
  button:                   { backgroundColor: "#007AFF", padding: 14, borderRadius: 8, marginTop: 16, alignItems: "center" },
  buttonDisabled:           { backgroundColor: "#aacff8" },
  buttonText:               { color: "#fff", fontWeight: "600", fontSize: 15 },
  whatsNext:                { marginTop: 20, backgroundColor: "#fff", padding: 12, borderRadius: 8 },
  bullet:                   { marginTop: 6, color: "#333" },
});

const sp = StyleSheet.create({
  stepRow:     { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  stepBtn:     { width: 44, height: 44, borderRadius: 10, backgroundColor: "#007AFF", alignItems: "center", justifyContent: "center" },
  stepBtnTxt:  { color: "#fff", fontSize: 24, fontWeight: "600", lineHeight: 28 },
  stepInput:   { flex: 1, borderWidth: 1.5, borderColor: "#007AFF", borderRadius: 8, paddingVertical: 8, fontSize: 20, fontWeight: "700", textAlign: "center", color: "#111", backgroundColor: "#fff" },
  // search modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox:     { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", paddingBottom: 24 },
  modalHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  modalTitle:   { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  modalClose:   { fontSize: 18, color: "#64748B", fontWeight: "600" },
  modalSearch:  { margin: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10, fontSize: 14, color: "#111" },
  modalItem:    { paddingVertical: 13, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  modalItemText:{ fontSize: 14, color: "#1E293B" },
});
