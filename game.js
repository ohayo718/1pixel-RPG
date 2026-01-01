/**
 * 1ピクセルRPG - メインゲームエンジン
 * 極端な抽象化で想像力を刺激するミニマルRPG
 */

// ============================================
// ゲーム定数
// ============================================

const WORLD_SIZE = 32;
const TILE_SIZE = 8;
const CANVAS_SIZE = WORLD_SIZE * TILE_SIZE;

const TILE_TYPES = {
    EMPTY: 0,
    PLAYER: 1,
    ENEMY: 2,
    TOWN: 3,
    FOREST: 4,
    WATER: 5,
    MOUNTAIN: 6,
    TREASURE: 7,
    NPC: 8,
    BOSS: 9
};

const COLORS = {
    [TILE_TYPES.EMPTY]: '#0a0a0f',
    [TILE_TYPES.PLAYER]: '#4af',
    [TILE_TYPES.ENEMY]: '#f44',
    [TILE_TYPES.TOWN]: '#4f4',
    [TILE_TYPES.FOREST]: '#2a5',
    [TILE_TYPES.WATER]: '#38f',
    [TILE_TYPES.MOUNTAIN]: '#666',
    [TILE_TYPES.TREASURE]: '#fd0',
    [TILE_TYPES.NPC]: '#ff4',
    [TILE_TYPES.BOSS]: '#f0f'
};

// ============================================
// ゲーム状態
// ============================================

const gameState = {
    screen: 'title',
    player: {
        x: 16,
        y: 16,
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        level: 1,
        exp: 0,
        expToNext: 100,
        attack: 10,
        defense: 5,
        statusEffects: [] // 'poison', 'burn', 'frozen', 'healing'
    },
    world: [],
    entities: [],
    currentEnemy: null,
    currentTown: null,
    storyQueue: [],
    moveCount: 0,
    isPlayerTurn: true
};

// ============================================
// ストーリーとテキスト
// ============================================

const STORIES = {
    intro: [
        { text: "あなたは1つの光点として、この世界に降り立った。", narrator: true },
        { text: "周囲には何もない...いや、遠くに微かな色が見える。", narrator: true },
        { text: "東に緑の集合体。街だろうか。", narrator: true },
        { text: "西には赤い点が蠢いている。敵か。", narrator: true },
        { text: "あなたは歩き出した。", narrator: true }
    ],
    
    enemyEncounter: [
        "赤い光があなたを捕捉した。",
        "鼓動のような点滅。それは近づいてくる。",
        "対峙する二つの光点。戦いは避けられない。"
    ],
    
    townEnter: [
        "緑の光が優しくあなたを包み込む。",
        "ここには安らぎがある。旅人たちの息遣いが聞こえる気がする。",
        "休息しよう。回復できる。"
    ],
    
    victory: [
        "赤い光は消えた。",
        "静寂が戻る。あなたは少し強くなった気がする。"
    ],
    
    levelUp: [
        "光が一瞬、強く輝いた。",
        "レベルアップ！あなたの存在がより確かになった。"
    ],
    
    defeat: [
        "あなたの光は弱まり...消えた。",
        "しかし、世界はあなたを忘れない。",
        "再び光となって、旅を続けよう。"
    ]
};

const ENEMY_TYPES = [
    { name: 'スライム', hp: 30, attack: 5, defense: 2, exp: 20, color: '#f66' },
    { name: 'ゴブリン', hp: 50, attack: 8, defense: 4, exp: 35, color: '#f44' },
    { name: 'オーク', hp: 80, attack: 12, defense: 6, exp: 60, color: '#c33' },
    { name: 'ダークナイト', hp: 120, attack: 18, defense: 10, exp: 100, color: '#922' },
    { name: '??? (ボス)', hp: 200, attack: 25, defense: 15, exp: 300, color: '#f0f', isBoss: true }
];

const TOWNS = [
    { 
        name: '始まりの村', 
        description: '小さな光が集まる場所。旅人はここで休息する。',
        innCost: 10,
        shopItems: [
            { name: '回復薬', price: 20, effect: 'heal', value: 30 },
            { name: '魔法の粉', price: 30, effect: 'mp', value: 20 }
        ],
        dialogue: [
            '「ようこそ、旅人よ。東の森には危険な光が潜んでいる...」',
            '「この世界は1ピクセルずつ広がっている。想像すれば見えるさ。」',
            '「北の山を越えると、伝説の光があるらしい...」'
        ]
    },
    {
        name: '水辺の町',
        description: '青い輝きに囲まれた静かな場所。',
        innCost: 20,
        shopItems: [
            { name: '高級回復薬', price: 50, effect: 'heal', value: 80 },
            { name: 'エーテル', price: 60, effect: 'mp', value: 50 }
        ],
        dialogue: [
            '「この水は全てを映し出す。あなたの本当の色もね。」',
            '「深淵には古の光が眠っている...目覚めさせてはならない。」'
        ]
    }
];

// ============================================
// DOM要素
// ============================================

let canvas, ctx;
let townCanvas, townCtx;
let elements = {};

// ============================================
// 初期化
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initCanvas();
    initEventListeners();
    generateWorld();
});

function initElements() {
    elements = {
        titleScreen: document.getElementById('title-screen'),
        gameScreen: document.getElementById('game-screen'),
        battleScreen: document.getElementById('battle-screen'),
        townScreen: document.getElementById('town-screen'),
        startBtn: document.getElementById('start-btn'),
        storyText: document.getElementById('story-text'),
        storyChoices: document.getElementById('story-choices'),
        hpBar: document.getElementById('hp-bar'),
        mpBar: document.getElementById('mp-bar'),
        hpText: document.getElementById('hp-text'),
        mpText: document.getElementById('mp-text'),
        levelText: document.getElementById('level-text'),
        expText: document.getElementById('exp-text'),
        battleLog: document.getElementById('battle-log'),
        enemyPixel: document.getElementById('enemy-pixel'),
        enemyName: document.getElementById('enemy-name'),
        playerPixel: document.getElementById('player-pixel'),
        townName: document.getElementById('town-name'),
        townDescription: document.getElementById('town-description'),
        overlay: document.getElementById('overlay'),
        overlayContent: document.getElementById('overlay-content')
    };
}

function initCanvas() {
    canvas = document.getElementById('game-canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    townCanvas = document.getElementById('town-canvas');
    townCanvas.width = 128;
    townCanvas.height = 128;
    townCtx = townCanvas.getContext('2d');
    townCtx.imageSmoothingEnabled = false;
}

function initEventListeners() {
    // スタートボタン
    elements.startBtn.addEventListener('click', startGame);
    
    // キーボード操作
    document.addEventListener('keydown', handleKeydown);
    
    // バトルコマンド
    document.querySelectorAll('.battle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleBattleAction(action);
        });
    });
    
    // 街メニュー
    document.querySelectorAll('.town-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleTownAction(action);
        });
    });
}

// ============================================
// ワールド生成
// ============================================

function generateWorld() {
    // 空の世界を作成
    gameState.world = Array(WORLD_SIZE).fill(null).map(() => 
        Array(WORLD_SIZE).fill(TILE_TYPES.EMPTY)
    );
    
    // 地形を配置
    generateTerrain();
    
    // 街を配置
    placeTowns();
    
    // 敵を配置
    placeEnemies();
    
    // 宝箱を配置
    placeTreasures();
}

function generateTerrain() {
    // 森林エリア
    for (let i = 0; i < 20; i++) {
        const x = Math.floor(Math.random() * (WORLD_SIZE - 10)) + 5;
        const y = Math.floor(Math.random() * (WORLD_SIZE - 10)) + 5;
        if (gameState.world[y][x] === TILE_TYPES.EMPTY) {
            gameState.world[y][x] = TILE_TYPES.FOREST;
        }
    }
    
    // 水域
    const waterX = Math.floor(Math.random() * 10) + 5;
    const waterY = Math.floor(Math.random() * 10) + 5;
    for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 5; dx++) {
            if (waterY + dy < WORLD_SIZE && waterX + dx < WORLD_SIZE) {
                gameState.world[waterY + dy][waterX + dx] = TILE_TYPES.WATER;
            }
        }
    }
    
    // 山岳
    const mountX = WORLD_SIZE - 8;
    for (let dy = 0; dy < 6; dy++) {
        for (let dx = 0; dx < 3; dx++) {
            if (dy < WORLD_SIZE && mountX + dx < WORLD_SIZE) {
                gameState.world[dy + 2][mountX + dx] = TILE_TYPES.MOUNTAIN;
            }
        }
    }
}

function placeTowns() {
    const townPositions = [
        { x: 5, y: 5 },
        { x: 25, y: 20 }
    ];
    
    townPositions.forEach((pos, i) => {
        // 街は3x3の緑ブロック
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = pos.x + dx;
                const ty = pos.y + dy;
                if (tx >= 0 && tx < WORLD_SIZE && ty >= 0 && ty < WORLD_SIZE) {
                    gameState.world[ty][tx] = TILE_TYPES.TOWN;
                }
            }
        }
        
        gameState.entities.push({
            type: 'town',
            x: pos.x,
            y: pos.y,
            data: TOWNS[i] || TOWNS[0]
        });
    });
}

function placeEnemies() {
    for (let i = 0; i < 8; i++) {
        let x, y, attempts = 0;
        do {
            x = Math.floor(Math.random() * WORLD_SIZE);
            y = Math.floor(Math.random() * WORLD_SIZE);
            attempts++;
        } while (gameState.world[y][x] !== TILE_TYPES.EMPTY && attempts < 100);
        
        if (attempts < 100) {
            gameState.world[y][x] = TILE_TYPES.ENEMY;
            
            // エネミータイプを決定（プレイヤーから遠いほど強い）
            const dist = Math.sqrt(Math.pow(x - 16, 2) + Math.pow(y - 16, 2));
            const enemyIndex = Math.min(
                Math.floor(dist / 8), 
                ENEMY_TYPES.length - 2
            );
            
            gameState.entities.push({
                type: 'enemy',
                x, y,
                data: { ...ENEMY_TYPES[enemyIndex] }
            });
        }
    }
    
    // ボスを配置
    const bossX = WORLD_SIZE - 3;
    const bossY = 3;
    gameState.world[bossY][bossX] = TILE_TYPES.BOSS;
    gameState.entities.push({
        type: 'enemy',
        x: bossX,
        y: bossY,
        data: { ...ENEMY_TYPES[ENEMY_TYPES.length - 1] }
    });
}

function placeTreasures() {
    for (let i = 0; i < 3; i++) {
        let x, y, attempts = 0;
        do {
            x = Math.floor(Math.random() * WORLD_SIZE);
            y = Math.floor(Math.random() * WORLD_SIZE);
            attempts++;
        } while (gameState.world[y][x] !== TILE_TYPES.EMPTY && attempts < 100);
        
        if (attempts < 100) {
            gameState.world[y][x] = TILE_TYPES.TREASURE;
            gameState.entities.push({
                type: 'treasure',
                x, y,
                data: { gold: 50 + Math.floor(Math.random() * 100) }
            });
        }
    }
}

// ============================================
// ゲーム開始
// ============================================

async function startGame() {
    await window.audioSystem.initialize();
    window.audioSystem.playUISound('confirm');
    
    switchScreen('game');
    
    // イントロストーリー
    await showStorySequence(STORIES.intro);
    
    render();
    
    // 環境音開始
    startEnvironmentSounds();
}

function switchScreen(screenName) {
    gameState.screen = screenName;
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const screenElement = document.getElementById(`${screenName}-screen`);
    if (screenElement) {
        screenElement.classList.add('active');
    }
}

// ============================================
// レンダリング
// ============================================

function render() {
    if (gameState.screen !== 'game') return;
    
    // キャンバスクリア
    ctx.fillStyle = COLORS[TILE_TYPES.EMPTY];
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // ワールド描画
    for (let y = 0; y < WORLD_SIZE; y++) {
        for (let x = 0; x < WORLD_SIZE; x++) {
            const tile = gameState.world[y][x];
            if (tile !== TILE_TYPES.EMPTY) {
                ctx.fillStyle = COLORS[tile];
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    
    // プレイヤー描画
    drawPlayer();
    
    // UI更新
    updateStatusUI();
}

function drawPlayer() {
    const { x, y, hp, maxHp, statusEffects } = gameState.player;
    
    // HP割合で色を変更
    const hpRatio = hp / maxHp;
    let color;
    
    if (statusEffects.includes('poison')) {
        // 毒：紫に点滅
        const flash = Math.sin(Date.now() / 100) > 0;
        color = flash ? '#a855f7' : '#4af';
    } else if (statusEffects.includes('burn')) {
        // 火傷：オレンジに点滅
        const flash = Math.sin(Date.now() / 50) > 0;
        color = flash ? '#f97316' : '#4af';
    } else if (statusEffects.includes('frozen')) {
        // 凍結：青白く
        color = '#38bdf8';
    } else if (statusEffects.includes('healing')) {
        // 回復中：緑に輝く
        const glow = (Math.sin(Date.now() / 200) + 1) / 2;
        const g = Math.floor(170 + glow * 85);
        color = `rgb(100, ${g}, 100)`;
    } else {
        // 通常：HPに応じて青→赤
        const r = Math.floor(255 * (1 - hpRatio) + 68 * hpRatio);
        const g = Math.floor(68 * hpRatio + 68 * (1 - hpRatio));
        const b = Math.floor(255 * hpRatio);
        color = `rgb(${r}, ${g}, ${b})`;
    }
    
    ctx.fillStyle = color;
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    
    // グロー効果
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    ctx.shadowBlur = 0;
    
    // 状態エフェクトがあれば点滅アニメーション継続
    if (statusEffects.length > 0) {
        requestAnimationFrame(() => render());
    }
}

function updateStatusUI() {
    const { hp, maxHp, mp, maxMp, level, exp, expToNext } = gameState.player;
    
    elements.hpBar.style.width = `${(hp / maxHp) * 100}%`;
    elements.mpBar.style.width = `${(mp / maxMp) * 100}%`;
    elements.hpText.textContent = hp;
    elements.mpText.textContent = mp;
    elements.levelText.textContent = level;
    elements.expText.textContent = `${exp}/${expToNext}`;
}

// ============================================
// 入力処理
// ============================================

function handleKeydown(e) {
    if (gameState.screen !== 'game') return;
    
    const { player } = gameState;
    let newX = player.x;
    let newY = player.y;
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
            newY = Math.max(0, player.y - 1);
            break;
        case 'ArrowDown':
        case 's':
            newY = Math.min(WORLD_SIZE - 1, player.y + 1);
            break;
        case 'ArrowLeft':
        case 'a':
            newX = Math.max(0, player.x - 1);
            break;
        case 'ArrowRight':
        case 'd':
            newX = Math.min(WORLD_SIZE - 1, player.x + 1);
            break;
        case ' ':
            e.preventDefault();
            checkInteraction();
            return;
        case 'm':
            const muted = window.audioSystem.toggleMute();
            showMessage(muted ? '🔇 ミュート' : '🔊 サウンドON');
            return;
        default:
            return;
    }
    
    e.preventDefault();
    
    // 移動可能かチェック
    const targetTile = gameState.world[newY][newX];
    
    if (targetTile === TILE_TYPES.WATER || targetTile === TILE_TYPES.MOUNTAIN) {
        // 水・山は通れない
        window.audioSystem.playUISound('cancel');
        showMessage(targetTile === TILE_TYPES.WATER ? '水が深くて渡れない...' : '険しい山だ...');
        return;
    }
    
    // 移動実行
    if (newX !== player.x || newY !== player.y) {
        player.x = newX;
        player.y = newY;
        gameState.moveCount++;
        
        // 足音
        const surface = getSurfaceType(newX, newY);
        window.audioSystem.playFootstep(surface);
        
        // 立体音響の更新
        window.audioSystem.updatePlayerPosition(newX, newY);
        
        // 敵の唸り声（近くにいれば）
        checkNearbyEnemies();
        
        // イベントチェック
        checkTileEvents(newX, newY);
        
        render();
    }
}

function getSurfaceType(x, y) {
    const tile = gameState.world[y][x];
    switch (tile) {
        case TILE_TYPES.FOREST: return 'grass';
        case TILE_TYPES.TOWN: return 'stone';
        default: return 'grass';
    }
}

function checkNearbyEnemies() {
    const { x, y } = gameState.player;
    
    gameState.entities
        .filter(e => e.type === 'enemy')
        .forEach(enemy => {
            const dist = Math.sqrt(Math.pow(enemy.x - x, 2) + Math.pow(enemy.y - y, 2));
            if (dist < 8 && dist > 0) {
                const intensity = 1 - (dist / 8);
                if (Math.random() < intensity * 0.3) {
                    const enemyType = enemy.data.isBoss ? 'boss' : 'normal';
                    window.audioSystem.playEnemyGrowl(enemy.x, enemy.y, enemyType);
                }
            }
        });
}

function checkInteraction() {
    const { x, y } = gameState.player;
    
    // 隣接タイルをチェック
    const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
    ];
    
    for (const dir of directions) {
        const tx = x + dir.dx;
        const ty = y + dir.dy;
        
        if (tx >= 0 && tx < WORLD_SIZE && ty >= 0 && ty < WORLD_SIZE) {
            const tile = gameState.world[ty][tx];
            
            if (tile === TILE_TYPES.TREASURE) {
                collectTreasure(tx, ty);
                return;
            }
        }
    }
    
    showMessage('何もない...');
}

function checkTileEvents(x, y) {
    const tile = gameState.world[y][x];
    
    switch (tile) {
        case TILE_TYPES.ENEMY:
        case TILE_TYPES.BOSS:
            startBattle(x, y);
            break;
        case TILE_TYPES.TOWN:
            enterTown(x, y);
            break;
        case TILE_TYPES.TREASURE:
            collectTreasure(x, y);
            break;
    }
}

// ============================================
// バトルシステム
// ============================================

async function startBattle(x, y) {
    const enemy = gameState.entities.find(
        e => e.type === 'enemy' && e.x === x && e.y === y
    );
    
    if (!enemy) return;
    
    gameState.currentEnemy = {
        ...enemy.data,
        currentHp: enemy.data.hp,
        x, y
    };
    
    gameState.isPlayerTurn = true;
    
    // バトル演出
    window.audioSystem.stopAllAmbient();
    window.audioSystem.playEnemyGrowl(x, y, enemy.data.isBoss ? 'boss' : 'normal');
    
    switchScreen('battle');
    
    // 敵ピクセル表示
    elements.enemyPixel.style.background = enemy.data.color;
    elements.enemyPixel.style.boxShadow = `0 0 30px ${enemy.data.color}`;
    elements.enemyName.textContent = enemy.data.name;
    
    // プレイヤーピクセル表示
    updateBattlePlayerPixel();
    
    // バトルログ
    elements.battleLog.innerHTML = '';
    await addBattleLog(STORIES.enemyEncounter[Math.floor(Math.random() * STORIES.enemyEncounter.length)]);
    
    enableBattleButtons(true);
}

function updateBattlePlayerPixel() {
    const { hp, maxHp } = gameState.player;
    const hpRatio = hp / maxHp;
    
    const r = Math.floor(255 * (1 - hpRatio) + 68 * hpRatio);
    const g = Math.floor(68 * hpRatio + 68 * (1 - hpRatio));
    const b = Math.floor(255 * hpRatio);
    const color = `rgb(${r}, ${g}, ${b})`;
    
    elements.playerPixel.style.background = color;
    elements.playerPixel.style.boxShadow = `0 0 30px ${color}`;
}

async function handleBattleAction(action) {
    if (!gameState.isPlayerTurn) return;
    
    enableBattleButtons(false);
    
    const enemy = gameState.currentEnemy;
    
    switch (action) {
        case 'attack':
            await playerAttack();
            break;
        case 'magic':
            await playerMagic();
            break;
        case 'defend':
            await playerDefend();
            break;
        case 'run':
            await tryRun();
            return;
    }
    
    // 敵が倒れたかチェック
    if (enemy.currentHp <= 0) {
        await handleVictory();
        return;
    }
    
    // 敵のターン
    gameState.isPlayerTurn = false;
    await enemyTurn();
    
    // プレイヤーが倒れたかチェック
    if (gameState.player.hp <= 0) {
        await handleDefeat();
        return;
    }
    
    gameState.isPlayerTurn = true;
    enableBattleButtons(true);
}

async function playerAttack() {
    const damage = Math.max(1, gameState.player.attack - gameState.currentEnemy.defense + randomVariance(5));
    gameState.currentEnemy.currentHp -= damage;
    
    window.audioSystem.playBattleSound('attack');
    await sleep(100);
    window.audioSystem.playBattleSound('hit');
    
    await addBattleLog(`あなたの攻撃！<span class="damage">${damage}</span>のダメージ！`, 'damage');
    
    // 敵ピクセルをフラッシュ
    flashElement(elements.enemyPixel);
}

async function playerMagic() {
    if (gameState.player.mp < 10) {
        await addBattleLog('MPが足りない...', 'miss');
        enableBattleButtons(true);
        return;
    }
    
    gameState.player.mp -= 10;
    const damage = Math.max(1, gameState.player.attack * 1.5 + randomVariance(10));
    gameState.currentEnemy.currentHp -= damage;
    
    window.audioSystem.playBattleSound('magic');
    
    await addBattleLog(`✨ 魔法攻撃！<span class="damage">${Math.floor(damage)}</span>のダメージ！`, 'damage');
    
    flashElement(elements.enemyPixel, '#a855f7');
    updateStatusUI();
}

async function playerDefend() {
    gameState.player.statusEffects.push('defending');
    window.audioSystem.playUISound('select');
    await addBattleLog('🛡️ 防御体勢を取った。');
}

async function enemyTurn() {
    await sleep(500);
    
    const enemy = gameState.currentEnemy;
    let damage = Math.max(1, enemy.attack - gameState.player.defense + randomVariance(3));
    
    // 防御中ならダメージ半減
    if (gameState.player.statusEffects.includes('defending')) {
        damage = Math.floor(damage / 2);
        gameState.player.statusEffects = gameState.player.statusEffects.filter(s => s !== 'defending');
    }
    
    gameState.player.hp = Math.max(0, gameState.player.hp - damage);
    
    window.audioSystem.playBattleSound('hit');
    
    await addBattleLog(`${enemy.name}の攻撃！<span class="damage">${damage}</span>のダメージを受けた！`, 'damage');
    
    flashElement(elements.playerPixel, '#f44');
    updateBattlePlayerPixel();
    updateStatusUI();
}

async function tryRun() {
    const chance = Math.random();
    
    if (chance > 0.3) {
        window.audioSystem.playUISound('confirm');
        await addBattleLog('逃走成功！');
        await sleep(500);
        endBattle(false);
    } else {
        await addBattleLog('逃げられなかった！', 'miss');
        
        gameState.isPlayerTurn = false;
        await enemyTurn();
        
        if (gameState.player.hp <= 0) {
            await handleDefeat();
            return;
        }
        
        gameState.isPlayerTurn = true;
        enableBattleButtons(true);
    }
}

async function handleVictory() {
    window.audioSystem.playBattleSound('victory');
    
    await showStorySequence(STORIES.victory);
    
    // 経験値獲得
    const expGain = gameState.currentEnemy.exp;
    gameState.player.exp += expGain;
    
    await addBattleLog(`<span class="heal">${expGain}</span> の経験値を獲得！`);
    
    // レベルアップチェック
    while (gameState.player.exp >= gameState.player.expToNext) {
        await levelUp();
    }
    
    // マップから敵を削除
    const { x, y } = gameState.currentEnemy;
    gameState.world[y][x] = TILE_TYPES.EMPTY;
    gameState.entities = gameState.entities.filter(
        e => !(e.type === 'enemy' && e.x === x && e.y === y)
    );
    
    await sleep(1000);
    endBattle(true);
}

async function levelUp() {
    gameState.player.level++;
    gameState.player.exp -= gameState.player.expToNext;
    gameState.player.expToNext = Math.floor(gameState.player.expToNext * 1.5);
    
    // ステータスアップ
    gameState.player.maxHp += 20;
    gameState.player.maxMp += 10;
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;
    gameState.player.attack += 5;
    gameState.player.defense += 3;
    
    await showStorySequence(STORIES.levelUp);
    await addBattleLog(`<span class="heal">レベル ${gameState.player.level} になった！</span>`);
    
    updateStatusUI();
}

async function handleDefeat() {
    window.audioSystem.playBattleSound('defeat');
    
    await showStorySequence(STORIES.defeat);
    
    // 復活
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;
    gameState.player.x = 16;
    gameState.player.y = 16;
    
    await sleep(1500);
    endBattle(false);
}

function endBattle(victory) {
    gameState.currentEnemy = null;
    gameState.player.statusEffects = [];
    
    switchScreen('game');
    startEnvironmentSounds();
    render();
}

function enableBattleButtons(enabled) {
    document.querySelectorAll('.battle-btn').forEach(btn => {
        btn.disabled = !enabled;
    });
}

async function addBattleLog(message, type = '') {
    const p = document.createElement('p');
    p.innerHTML = message;
    if (type) p.classList.add(type);
    elements.battleLog.appendChild(p);
    elements.battleLog.scrollTop = elements.battleLog.scrollHeight;
    await sleep(300);
}

// ============================================
// 街システム
// ============================================

async function enterTown(x, y) {
    const town = gameState.entities.find(
        e => e.type === 'town' && Math.abs(e.x - x) <= 1 && Math.abs(e.y - y) <= 1
    );
    
    if (!town) return;
    
    gameState.currentTown = town.data;
    
    window.audioSystem.stopAllAmbient();
    window.audioSystem.startAmbientSound('town', x, y, 'town');
    
    switchScreen('town');
    
    elements.townName.textContent = town.data.name;
    elements.townDescription.textContent = town.data.description;
    
    // 街のビジュアルを描画
    drawTownVisual();
    
    await showStorySequence(STORIES.townEnter);
}

function drawTownVisual() {
    townCtx.fillStyle = '#0a0a0f';
    townCtx.fillRect(0, 0, 128, 128);
    
    // 街を表現する複数の緑ピクセル
    const positions = [
        { x: 48, y: 48, size: 32 },
        { x: 32, y: 64, size: 16 },
        { x: 80, y: 56, size: 16 },
        { x: 56, y: 80, size: 12 },
        { x: 40, y: 40, size: 8 }
    ];
    
    positions.forEach(p => {
        townCtx.fillStyle = '#4f4';
        townCtx.shadowColor = '#4f4';
        townCtx.shadowBlur = 10;
        townCtx.fillRect(p.x, p.y, p.size, p.size);
    });
    
    townCtx.shadowBlur = 0;
}

async function handleTownAction(action) {
    const town = gameState.currentTown;
    window.audioSystem.playUISound('select');
    
    switch (action) {
        case 'inn':
            gameState.player.hp = gameState.player.maxHp;
            gameState.player.mp = gameState.player.maxMp;
            showMessage('HP・MPが全回復した！');
            updateStatusUI();
            break;
            
        case 'shop':
            showShopMenu();
            break;
            
        case 'talk':
            const dialogue = town.dialogue[Math.floor(Math.random() * town.dialogue.length)];
            showMessage(dialogue);
            break;
            
        case 'leave':
            window.audioSystem.stopAmbientSound('town');
            switchScreen('game');
            startEnvironmentSounds();
            render();
            break;
    }
}

function showShopMenu() {
    const town = gameState.currentTown;
    let html = '<h3>🏪 道具屋</h3><div class="shop-items">';
    
    town.shopItems.forEach((item, i) => {
        html += `
            <button class="shop-item" data-index="${i}">
                ${item.name} - ${item.price}G
            </button>
        `;
    });
    
    html += '<button class="shop-close">閉じる</button></div>';
    
    elements.overlayContent.innerHTML = html;
    elements.overlay.classList.remove('hidden');
    
    // イベント追加
    document.querySelectorAll('.shop-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            buyItem(index);
        });
    });
    
    document.querySelector('.shop-close').addEventListener('click', () => {
        elements.overlay.classList.add('hidden');
    });
}

function buyItem(index) {
    const item = gameState.currentTown.shopItems[index];
    
    // 簡略化：お金システムは省略、効果だけ適用
    if (item.effect === 'heal') {
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + item.value);
        window.audioSystem.playBattleSound('heal');
    } else if (item.effect === 'mp') {
        gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + item.value);
        window.audioSystem.playBattleSound('magic');
    }
    
    showMessage(`${item.name}を使った！`);
    updateStatusUI();
}

// ============================================
// 宝箱
// ============================================

function collectTreasure(x, y) {
    const treasure = gameState.entities.find(
        e => e.type === 'treasure' && e.x === x && e.y === y
    );
    
    if (!treasure) return;
    
    window.audioSystem.playBattleSound('victory');
    
    // マップから削除
    gameState.world[y][x] = TILE_TYPES.EMPTY;
    gameState.entities = gameState.entities.filter(
        e => !(e.type === 'treasure' && e.x === x && e.y === y)
    );
    
    showMessage(`💎 宝箱を発見！${treasure.data.gold}Gを手に入れた！`);
    render();
}

// ============================================
// ストーリー表示
// ============================================

async function showStorySequence(stories) {
    for (const story of stories) {
        const text = typeof story === 'string' ? story : story.text;
        const isNarrator = typeof story === 'object' && story.narrator;
        
        await typeText(text, isNarrator);
        await sleep(1500);
    }
}

async function typeText(text, isNarrator = false) {
    elements.storyText.innerHTML = '';
    
    const span = document.createElement('span');
    if (isNarrator) span.classList.add('narrator');
    elements.storyText.appendChild(span);
    
    for (let i = 0; i < text.length; i++) {
        span.textContent += text[i];
        await sleep(30);
    }
}

function showMessage(message) {
    elements.storyText.innerHTML = `<span>${message}</span>`;
}

// ============================================
// 環境音
// ============================================

function startEnvironmentSounds() {
    const { x, y } = gameState.player;
    
    // 風の音（どこでも）
    window.audioSystem.startAmbientSound('wind', x + 10, y, 'wind');
    
    // 水域が近ければ水の音
    const hasWaterNearby = checkNearbyTile(TILE_TYPES.WATER, 10);
    if (hasWaterNearby) {
        const waterPos = findNearestTile(TILE_TYPES.WATER);
        if (waterPos) {
            window.audioSystem.startAmbientSound('water', waterPos.x, waterPos.y, 'water');
        }
    }
}

function checkNearbyTile(tileType, radius) {
    const { x, y } = gameState.player;
    
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const tx = x + dx;
            const ty = y + dy;
            if (tx >= 0 && tx < WORLD_SIZE && ty >= 0 && ty < WORLD_SIZE) {
                if (gameState.world[ty][tx] === tileType) {
                    return true;
                }
            }
        }
    }
    return false;
}

function findNearestTile(tileType) {
    const { x, y } = gameState.player;
    let nearest = null;
    let minDist = Infinity;
    
    for (let ty = 0; ty < WORLD_SIZE; ty++) {
        for (let tx = 0; tx < WORLD_SIZE; tx++) {
            if (gameState.world[ty][tx] === tileType) {
                const dist = Math.sqrt(Math.pow(tx - x, 2) + Math.pow(ty - y, 2));
                if (dist < minDist) {
                    minDist = dist;
                    nearest = { x: tx, y: ty };
                }
            }
        }
    }
    
    return nearest;
}

// ============================================
// ユーティリティ
// ============================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomVariance(range) {
    return Math.floor(Math.random() * range * 2) - range;
}

function flashElement(element, color = '#fff') {
    const original = element.style.background;
    element.style.background = color;
    element.style.boxShadow = `0 0 50px ${color}`;
    
    setTimeout(() => {
        element.style.background = original;
        element.style.boxShadow = `0 0 30px ${original}`;
    }, 100);
}
