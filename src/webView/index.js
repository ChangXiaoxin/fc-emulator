
const cvs = document.getElementById('cvs');
cvs.width = 256;
cvs.height = 240;
const ctx = cvs.getContext('2d');

window.addEventListener('load', init);
window.addEventListener("message", event =>{
  const message = event.data;
  if (message.imageData)
  {
    let imgData = ctx.createImageData(256, 240);
    for (var i=0;i<imgData.data.length;i+=4)
      {
      imgData.data[i+0]=message.imageData[0];
      imgData.data[i+1]=message.imageData[1];
      imgData.data[i+2]=message.imageData[2];
      imgData.data[i+3]=message.imageData[3];
      }
    ctx.putImageData(imgData,10,10);
  }
});

function init(){
  // init
}
