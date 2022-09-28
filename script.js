let c = document.getElementById("canvas"),
	ctx = c.getContext('2d');
let scanC = document.getElementById("scanImg")
let scanCtx = scanC.getContext('2d')

let img = document.getElementById('image')

let colDisp = document.getElementById('next-color')

let detail = 1
let size = [1500,1000]
c.width = size[0] * detail
c.height = size[1] * detail
scanImg.width = size[0]
scanImg.height = size[1]

let progress = 0;
let fadeFunction = 0
let id;
newImg()

let simplex = new SimplexNoise('i');
let seedRng = new Math.seedrandom('hello.');

let groups = []

let runTimer
let firstTime = true

img.onload = () => {
	// ctx.drawImage(img, 0, 0, size[0] * detail, size[1] * detail);
	scanCtx.drawImage(img, 0, 0, size[0], size[1]);
	if (firstTime){
		firstTime = false
	}
	fadeFunction = Math.min(Math.round(Math.random()*wipeModes.length),wipeModes.length-1)
	groups[0] = new Renderer({})
	runTimer = setInterval(run,20)
	ctx.clearRect(0,0,size[0] * detail,size[1] * detail)
}

let wipeModes = [
	(r, g, b, gray, x, y) => {return {r: gray, g: gray, b: gray, name: 'Grayscale'}}, // 0
	(r, g, b, gray, x, y) => {return {r: r * 1.5, g: g * 1.5, b: b * 1.5, name: 'Brighten'}}, // 1
	(r, g, b, gray, x, y) => {return {r: r * Math.random(), g: g * Math.random(), b: b * Math.random(), name: 'Random RGB Addition'}}, // 2
	(r, g, b, gray, x, y) => {return {r: 255 - r, g: 255 - g, b: 255 - b, name: 'Invert'}}, // 3
	(r, g, b, gray, x, y) => {return {r: g, g: b, b: r, name: 'RGB Value Rotate'}}, // 4
	(r, g, b, gray, x, y) => {return {r: (r + x + y) % 255, g: (g + x + y) % 255, b: (b + x + y) % 255, name: 'Distort Wave'}}, // 5
	(r, g, b, gray, x, y) => {return {r: (r * (y / size[1])) % 255, g: (g * (y / size[1])) % 255, b: (b * (y / size[1])) % 255, name: 'Darken Gradient'}}, // 6
	(r, g, b, gray, x, y) => {return {r: (g + b) / 2, g: (b + r) / 2, b: (r + g) / 2, name: 'Average of Opposite RGB Channels'}}, // 7
	(r, g, b, gray, x, y) => {return {r: (g + b) % 255, g: (b + r) % 255, b: (r + g) % 255, name: "Sum of Opposite RGB Channels"}}, // 8
	(r, g, b, gray, x, y) => {return {r: (simplex.noise3D(x / 100, y / 100, r / 50) + 1) * 127.5, g: (simplex.noise3D(x / 100, y / 100, g / 50) + 1) * 127.5, b: (simplex.noise3D(x / 100, y / 100, b / 50) + 1) * 127.5, name: 'Noise'}}, // 9
	(r, g, b, gray, x, y) => {return {r: Math.round(r / 50) * 50, g: Math.round(g / 50) * 50, b: Math.round(b / 50) * 50, name: 'Limit Colors (Light)'}}, // 10
	(r, g, b, gray, x, y) => {return {r: Math.round(r / 100) * 100, g: Math.round(g / 100) * 100, b: Math.round(b / 100) * 100, name: 'Limit Colors (Medium)'}}, // 11
	(r, g, b, gray, x, y) => {return {r: (Math.sin(r / 10) + 1) * 127.5, g: (Math.sin(g / 10) + 1) * 127.5, b: (Math.sin(b / 10) + 1) * 127.5, name: 'Sine'}}, // 12
	(r, g, b, gray, x, y) => {return {r: (Math.sin(r / 10) + Math.cos(b / 10) + 2) * 63.75, g: (Math.sin(g / 10) + Math.cos(b / 10) + 2) * 63.75, b: (Math.sin(b / 10) + Math.cos(b / 10) + 2) * 63.75, name: 'Sine + Cosine'}}, // 13
	(r, g, b, gray, x, y) => {return {r: Math.round(r / 255) * 255, g: Math.round(g / 255) * 255, b: Math.round(b / 255) * 255, name: 'Limit Colors (Heavy)'}}, // 14
	(r, g, b, gray, x, y) => {return {r: Math.round(gray / 255) * 255, g: Math.round(gray / 255) * 255, b: Math.round(gray / 255) * 255, name: 'Limit Colors (Only Black and White)'}}, // 15
	(r, g, b, gray, x, y) => {return {r: r * (simplex.noise2D(x / 100, y / 100) + 1.5), g: g * (simplex.noise2D(x / 100, y / 100) + 1.5), b: b * (simplex.noise2D(x / 100, y / 100) + 1.5), name: 'Luminance Noise'}}, // 16
	(r, g, b, gray, x, y) => {return {r: Math.round(gray / 127.5) * 127.5, g: Math.round(gray / 127.5) * 127.5, b: Math.round(gray / 127.5) * 127.5, name: 'Limit Colors (Heavy, Greyscale)'}}, // 17
]

class Renderer {
	constructor (cfg) {
		this.num = cfg.num || size[1];
		this.speed = cfg.speed || 1;
		this.group = [];
		for (let i = 0; i < this.num; i++){
			this.group[i] = {
				x: 0,
				// y: Math.round(Math.random()*size[1]),
				y: i,
				subX: 0,
				subY: 0,
				done: false
			}
		}
	}
	getColor (x, y) {
		// let imgData = scanCtx.getImageData(0,0,size[0],size[1])
		// let red = y * ((size[0] * detail) * 4) + x * 4;
		let data = scanCtx.getImageData(x, y, 1, 1).data
		let color = [
			[data[0], data[1], data[2], data[3]],
			`rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`,
			Math.round((data[0] + data[1] + data[2]) / 3),
			`rgba(${(Math.round((data[0] + data[1] + data[2]) / 3) + ',').repeat(3)}255)`
		]
		return color;
	}
	updateGroup () {
		let performanceSpeed = performance.now()
		let allDone = true
		progress = 0;
		let newColors;
		for (i of this.group) {
			if (!i.done){
				let curColor = this.getColor(i.x, i.y)
				newColors = wipeModes[fadeFunction](curColor[0][0],curColor[0][1],curColor[0][2],curColor[2], i.x, i.y)
				ctx.fillStyle = `rgb(${newColors.r},${newColors.g},${newColors.b})`
				ctx.fillRect(((i.x * detail) + i.subX), i.y * detail, detail, detail)
				// console.log(i.subX + '\n' + curColor[2])
				i.subX += Math.min(((255 - curColor[2]) / 255) + Math.random(),1)
				while (i.subX >= 1){
					i.subX -= 1
					i.x += 1
					// console.log(`${i.subX} \n ${i.x}`)
				}
				if (i.x <= size[0]){
					// i.x = 0;
					// i.subX = 0;
					// i.y = Math.round(Math.random() * size[1])
					allDone = false
				} else {
					i.done = true
				}
				// ctx.fillStyle = 'white'
				// ctx.fillRect(((i.x) * detail) + i.subX, i.y * detail, detail, detail)
			}
			progress += i.x
		}
		colDisp.innerHTML = `<b>Render Speed:</b> ${Math.round((performance.now() - performanceSpeed)*100)/100}ms <br>
		<b>Mode:</b> ${(newColors.name || 'None')} <br>
		<b>Mode Number:</b> ${fadeFunction}<br>
		<b>Image:</b> ${id} <br>
		<b>Progress:</b> ${Math.min(Math.floor((progress / (size[0] * size[1])) * 1000) / 10,100)}%`
		if (performance.now() - performanceSpeed > 150){
			console.log(`skipped: ${performance.now() - performanceSpeed}ms`)
			allDone = true;
		}
		if (allDone) {
			clearInterval(runTimer)
			setTimeout(newImg,1000)
		}
	}
}

let frameNum = 0;
function run() {
	frameNum++;
	// ctx.fillStyle = 'rgba(0,0,0,1)'
	// ctx.fillStyle = 'rgba(0,0,0,0.1)'
	// ctx.fillRect(0, 0, size[0] * detail, size[1] * detail)
	// ctx.clearRect(0, 0, size[0] * detail, size[1] * detail)
	for (i of groups){
		i.updateGroup()
	}

}

document.addEventListener('click',()=>{
	clearInterval(runTimer)
	newImg()
})

function newImg(){
	id = Math.round(Math.random()*100);
	while ([86].includes(id)){
		console.log(`skipped image (ID: ${id})`)
		id = Math.round(Math.random()*100);
	}
	img.src = `https://picsum.photos/id/${id}/${size[0]}/${size[1]}`
}
