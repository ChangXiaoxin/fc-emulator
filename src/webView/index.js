
const cvs = document.getElementById('cvs');
cvs.width = 1000;
cvs.height = 1000;
const ctx = cvs.getContext('2d');
const LOG_SIZE = 10;
window.addEventListener('load', init);
window.addEventListener("message", event =>{
  const message = event.data;
  if (message.imageData){
    let imgData = ctx.createImageData(256, 240);
    for (let i = 0; i<imgData.data.length; i++){
      imgData.data[i]=message.imageData[i];
    }
    ctx.putImageData(imgData,0,20);
  }
  if (message.CPULOG){
    ctx.clearRect(260, 20, 400, 400);
    ctx.fillStyle = "green";
    ctx.fillRect(280, 228, 300, 18);
    ctx.font = "20px Courier New";
    ctx.fillStyle = "white";
    ctx.fillText(message.CPULOG[LOG_SIZE], 260, 40);
    ctx.font = "16px Courier New";
    for (let i = 0; i < LOG_SIZE; i++){
      ctx.fillText(message.CPULOG[i], 280, 80 + 18*i);
    }
  }
});

function init(){
  // init
}
