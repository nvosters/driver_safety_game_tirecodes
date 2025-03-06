const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#a0a0a0',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    render: {
        pixelArt: false,
        antialias: true,
        roundPixels: false,
        clearBeforeRender: true
    }
};

const game = new Phaser.Game(config);

let playerCar;
let cursors;
let otherCars;
let pedestrians;
let obstacles;
let score = 100;
let scoreText;
let gameSpeed = 0.8;
let gameState = 'menu';
let menuText;
let startButton;
let warningText;
let warningTimer;
let messageText;
let messageTimer;
let lastMessageTime = 0;
let lastScoreUpdate = 0;
let scoreUpdateInterval = 1000;
let lastCollisionTime = 0;
let bigfoot;
let bigfootActive = false;
let greenAlien;
let greenAlienActive = false;
let scrollingTexts = [];
let lastTextSpawnTime = 0;
let textScrollSpeed = 2;
let textSpawnInterval = 2000; // Base spawn interval in milliseconds

function preload() {
    // Load game assets
    this.load.image('road', 'assets/road.png');
    this.load.image('playerCar', 'assets/playerCar.png');
    this.load.image('otherCar', 'assets/otherCar.png');
    this.load.image('pedestrian', 'assets/pedestrian.png');
    this.load.image('obstacle', 'assets/obstacle.png');
    this.load.image('bigfoot', 'assets/bigfoot.png');
    this.load.image('tree_branch', 'assets/tree_branch.png');
    this.load.image('oil_spill', 'assets/oil_spill.png');
    this.load.image('roadblock', 'assets/roadblock.png');
    this.load.image('pothole', 'assets/pothole.png');
}

function create() {
    // Initialize game objects first
    const road = this.add.image(400, 300, 'road');
    road.setTint(0xFFFFFF);
    road.setAlpha(1);
    road.setDepth(0);

    // Create player car with proper depth
    playerCar = this.physics.add.sprite(400, 500, 'playerCar');
    playerCar.setTint(0xFFFFFF);
    playerCar.setAlpha(1);
    playerCar.setDepth(2);
    playerCar.setScale(1.5);
    playerCar.setCollideWorldBounds(true);
    playerCar.setBounce(0);

    cursors = this.input.keyboard.createCursorKeys();
    
    // Initialize game groups with physics
    otherCars = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Sprite,
        maxSize: 10,
        runChildUpdate: true,
        allowGravity: false,
        immovable: true
    });
    
    pedestrians = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Sprite,
        maxSize: 5,
        runChildUpdate: true,
        allowGravity: false,
        immovable: true
    });
    
    obstacles = this.physics.add.group({
        classType: Phaser.Physics.Arcade.Sprite,
        maxSize: 10,
        runChildUpdate: true,
        allowGravity: false,
        immovable: true
    });
    
    // Setup score display with brighter colors
    scoreText = this.add.text(10, 10, 'Score: ' + score, { 
        fontSize: '24px', 
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 },
        alpha: 1
    }).setDepth(3);
    
    // Setup warning text with brighter colors
    warningText = this.add.text(400, 50, '', {
        fontSize: '32px',
        color: '#ff8888',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 },
        stroke: '#000000',
        strokeThickness: 4,
        alpha: 1
    })
    .setOrigin(0.5)
    .setVisible(false)
    .setDepth(3);
    
    // Setup message text with brighter colors
    messageText = this.add.text(400, 300, '', {
        fontSize: '32px',
        color: '#ffffff',
        backgroundColor: '#ff3333',
        padding: { x: 20, y: 10 },
        stroke: '#000000',
        strokeThickness: 6,
        alpha: 1,
        fontStyle: 'bold',
        shadow: {
            offsetX: 2,
            offsetY: 2,
            color: '#000000',
            blur: 4
        }
    })
    .setOrigin(0.5)
    .setVisible(false)
    .setDepth(3);
    
    // Create menu overlay with proper depth
    const menuOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.4);
    menuOverlay.setDepth(4);
    
    // Create menu text with brighter colors
    menuText = this.add.text(400, 200, 'Driver Safety Game', {
        fontSize: '48px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 },
        stroke: '#000000',
        strokeThickness: 4
    })
    .setOrigin(0.5)
    .setDepth(5);
    
    // Create start button with brighter colors
    startButton = this.add.text(400, 300, 'Start Game', {
        fontSize: '32px',
        color: '#ffffff',
        backgroundColor: '#aaaaaa',
        padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setDepth(5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => startGame(this));
}

function startGame(scene) {
    gameState = 'playing';
    menuText.setVisible(false);
    startButton.setVisible(false);
    score = 100;
    scoreText.setText('Score: ' + score);
    gameSpeed = 1.2; // Increased base speed
    lastMessageTime = 0;
    lastScoreUpdate = Date.now();
    
    // Reset player position
    playerCar.x = 400;
    playerCar.y = 500;
    
    // Clear existing objects
    otherCars.clear(true, true);
    pedestrians.clear(true, true);
    obstacles.clear(true, true);
    
    // Spawn initial obstacles
    spawnObstacles(scene);
    textScrollSpeed = 2;
    textSpawnInterval = 2000; // Reset spawn interval when starting new game
}

function spawnObstacles(scene) {
    // Spawn more other cars with staggered positions
    for (let i = 0; i < 3; i++) {
        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(-200, -100) - (i * 200);
        const car = otherCars.create(x, y, 'otherCar');
        car.setTint(0xFFFFFF);
        car.setAlpha(1);
        car.setDepth(1);
        car.setScale(1.5);
        car.setCollideWorldBounds(false);
        car.setBounce(0);
    }
    
    // Spawn more pedestrians with offset
    for (let i = 0; i < 2; i++) {
        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(-200, -100) - (i * 300);
        const ped = pedestrians.create(x, y, 'pedestrian');
        ped.setTint(0xFFFFFF);
        ped.setAlpha(1);
        ped.setDepth(1);
        ped.setScale(1.5);
        ped.setCollideWorldBounds(false);
        ped.setBounce(0);
    }
    
    // Spawn more various obstacles with different offsets
    const obstacleTypes = ['obstacle', 'bigfoot', 'tree_branch', 'oil_spill', 'roadblock', 'pothole'];
    for (let i = 0; i < 3; i++) {
        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(-200, -100) - (i * 250);
        const type = obstacleTypes[Phaser.Math.Between(0, obstacleTypes.length - 1)];
        const obs = obstacles.create(x, y, type);
        obs.setTint(0xFFFFFF);
        obs.setAlpha(1);
        obs.setDepth(1);
        obs.setScale(1.5);
        obs.setCollideWorldBounds(false);
        obs.setBounce(0);
    }
}

function handleCollision(player, obstacle) {
    score -= 20;
    scoreText.setText('Score: ' + score);
    
    if (score <= 0) {
        gameOver(this);
    }
    
    showWarning('Safety Violation! -20 points');
}

function showWarning(message) {
    warningText.setText(message).setVisible(true);
    if (warningTimer) {
        clearTimeout(warningTimer);
    }
    warningTimer = setTimeout(() => {
        warningText.setVisible(false);
    }, 2000);
}

function showMessage(message) {
    messageText.setText(message).setVisible(true);
    if (messageTimer) {
        clearTimeout(messageTimer);
    }
    messageTimer = setTimeout(() => {
        messageText.setVisible(false);
    }, 3000);
}

function gameOver(scene) {
    gameState = 'gameover';
    menuText.setText('Game Over!\nFinal Score: ' + score).setVisible(true);
    startButton.setText('Play Again').setVisible(true);
}

function createScrollingText(scene, text) {
    const newText = scene.add.text(400, -50, text, {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#333333',
        padding: { x: 10, y: 5 },
        alpha: 0.8
    })
    .setOrigin(0.5)
    .setDepth(3);
    
    scrollingTexts.push(newText);
    return newText;
}

function update() {
    if (gameState !== 'playing') return;
    
    // Player movement - horizontal and vertical
    if (cursors.left.isDown) {
        playerCar.x -= 4;
    } else if (cursors.right.isDown) {
        playerCar.x += 4;
    }
    
    if (cursors.up.isDown) {
        playerCar.y -= 4;
    } else if (cursors.down.isDown) {
        playerCar.y += 4;
    }
    
    // Keep player within bounds
    playerCar.x = Phaser.Math.Clamp(playerCar.x, 50, 750);
    playerCar.y = Phaser.Math.Clamp(playerCar.y, 100, 550); // Added vertical bounds
    
    // Time-based scoring
    const currentTime = Date.now();
    if (currentTime - lastScoreUpdate >= scoreUpdateInterval) {
        score += 5; // Add 5 points every second
        scoreText.setText('Score: ' + score);
        lastScoreUpdate = currentTime;
    }
    
    // Move obstacles with improved reset logic and staggered positions
    otherCars.children.iterate(function (car, index) {
        if (car) {
            car.y += gameSpeed;
            if (car.y > 700) {
                car.y = -200 - (index * 200);
                car.x = Phaser.Math.Between(100, 700);
            }
        }
    });
    
    pedestrians.children.iterate(function (ped, index) {
        if (ped) {
            ped.y += gameSpeed;
            if (ped.y > 700) {
                ped.y = -200 - (index * 300);
                ped.x = Phaser.Math.Between(100, 700);
            }
        }
    });
    
    obstacles.children.iterate(function (obs, index) {
        if (obs) {
            obs.y += gameSpeed;
            if (obs.y > 700) {
                obs.y = -200 - (index * 250);
                obs.x = Phaser.Math.Between(100, 700);
            }
        }
    });
    
    // Check for collisions
    this.physics.overlap(playerCar, otherCars, handleCollision, null, this);
    this.physics.overlap(playerCar, pedestrians, handleCollision, null, this);
    this.physics.overlap(playerCar, obstacles, handleCollision, null, this);
    
    // Show random messages
    if (currentTime - lastMessageTime > 8000) {
        const messages = [
            "📱 Incoming Text Message",
            "📞 Incoming Call",
            "📧 Incoming Email",
            "💬 Incoming Message"
        ];
        const randomMessage = messages[Phaser.Math.Between(0, messages.length - 1)];
        showMessage(randomMessage);
        lastMessageTime = currentTime;
    }
    
    // Spawn new text with dynamic interval
    if (currentTime - lastTextSpawnTime >= textSpawnInterval) {
        const tireSizes = "295/75R22.5, 11R22.5, 11R24.5, 285/75R24.5, 315/80R22.5, 12R22.5, 385/65R22.5, 425/65R22.5";
        createScrollingText(this, tireSizes);
        lastTextSpawnTime = currentTime;
    }
    
    // Update all scrolling texts with dynamic speed
    scrollingTexts.forEach((text, index) => {
        if (text) {
            text.y += textScrollSpeed;
            if (text.y > 650) {
                text.destroy();
                scrollingTexts.splice(index, 1);
            }
        }
    });
    
    // Gradually increase game speed, text scroll speed, and spawn rate
    if (score % 100 === 0) {
        gameSpeed += 0.05;
        textScrollSpeed += 0.1;
        textSpawnInterval = Math.max(500, textSpawnInterval - 100); // Decrease spawn interval but not below 500ms
    }
}