let count = 0;

function addCounter() {
  count = count + 1;
  console.log(count);
}

const input = document.getElementById("textinput");
const display = document.getElementById("text");

btn1.addEventListener("click", () => {
  display.innerText = input.value;
});

function Janken(){
const userHand = prompt("グー、チョキ、パーのいずれかを入力してください");
const hands = ["グー", "チョキ", "パー"];
const computerHand = hands[Math.floor(Math.random() * 3)];
let result = "";

if(userHand === computerHand){
  result = "あいこ";
} else if(
  (userHand === "グー" && computerHand === "チョキ") ||
  (userHand === "チョキ" && computerHand === "パー") ||
  (userHand === "パー" && computerHand === "グー")
){
  result = "勝ち";
} else {
  result = "負け";
}

console.log("あなた: " + userHand);
console.log("コンピュータ: " + computerHand);
console.log("結果: " + result);


}