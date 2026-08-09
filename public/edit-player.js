const params = new URLSearchParams(window.location.search);

const id = params.get("id");

async function loadPlayer(){

    const response = await fetch(`/api/players/${id}`);

    const player = await response.json();

    document.getElementById("first_name").value = player.first_name;

    document.getElementById("last_name").value = player.last_name;

    document.getElementById("nickname").value = player.nickname || "";

    document.getElementById("position").value = player.position;

    document.getElementById("date_of_birth").value = player.date_of_birth;

    document.getElementById("status").value = player.status;

}

loadPlayer();


document.getElementById("editPlayerForm")

.addEventListener("submit",async(e)=>{

e.preventDefault();

const updatedPlayer={

first_name:document.getElementById("first_name").value,

last_name:document.getElementById("last_name").value,

nickname:document.getElementById("nickname").value,

position:document.getElementById("position").value,

date_of_birth:document.getElementById("date_of_birth").value,

status:document.getElementById("status").value

};

const response=await fetch(`/api/players/${id}`,{

method:"PUT",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify(updatedPlayer)

});

const result=await response.json();

alert(result.message);

window.location="view-players.html";

});