function init(){
    // Perform actions with the "document" object		
    const cvs = document.getElementById('cvs');
    cvs.width = 500;
    cvs.height = 500;
    const ctx = cvs.getContext('2d');
    ctx.lineWidth = 10;
    ctx.strokeRect(75, 140, 150, 110);
    ctx.fillRect(130, 190, 40, 60);
    ctx.beginPath();
    ctx.moveTo(50, 140);
    ctx.lineTo(150, 60);
    ctx.lineTo(250, 140);
    ctx.closePath();
    ctx.stroke();
}

window.addEventListener('load', init);