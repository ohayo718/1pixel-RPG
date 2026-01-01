/**
 * 1ピクセルRPG - 立体音響システム
 * Web Audio API + PannerNode で空間的な音響体験を実現
 */

class SpatialAudioSystem {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.listener = null;
        this.isInitialized = false;
        this.isMuted = false;
        
        // 環境音源を保持
        this.ambientSources = {};
        
        // プレイヤー位置（中心が0,0）
        this.playerPosition = { x: 0, y: 0 };
        
        // ワールドサイズ（正規化用）
        this.worldSize = 32;
    }
    
    /**
     * オーディオシステムを初期化（ユーザー操作後に呼び出す）
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // マスターボリューム
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.context.destination);
            
            // リスナー設定（プレイヤーの「耳」）
            this.listener = this.context.listener;
            if (this.listener.positionX) {
                this.listener.positionX.value = 0;
                this.listener.positionY.value = 0;
                this.listener.positionZ.value = 0;
                this.listener.forwardX.value = 0;
                this.listener.forwardY.value = 0;
                this.listener.forwardZ.value = -1;
                this.listener.upX.value = 0;
                this.listener.upY.value = 1;
                this.listener.upZ.value = 0;
            } else {
                // レガシーAPI
                this.listener.setPosition(0, 0, 0);
                this.listener.setOrientation(0, 0, -1, 0, 1, 0);
            }
            
            this.isInitialized = true;
            console.log('🎧 立体音響システム初期化完了');
            
        } catch (error) {
            console.error('オーディオ初期化エラー:', error);
        }
    }
    
    /**
     * PannerNodeを作成（3D空間に音源を配置）
     */
    createPanner(x, y, options = {}) {
        const panner = this.context.createPanner();
        
        // パンニングモデル設定
        panner.panningModel = 'HRTF'; // 頭部伝達関数で自然な立体音響
        panner.distanceModel = options.distanceModel || 'exponential';
        panner.refDistance = options.refDistance || 1;
        panner.maxDistance = options.maxDistance || 50;
        panner.rolloffFactor = options.rolloffFactor || 1.5;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 360;
        panner.coneOuterGain = 0;
        
        // 位置を設定
        this.setPannerPosition(panner, x, y);
        
        return panner;
    }
    
    /**
     * Pannerの位置を更新
     */
    setPannerPosition(panner, x, y) {
        // ワールド座標を音響空間にマッピング
        const audioX = (x - this.playerPosition.x) / 5;
        const audioY = 0;
        const audioZ = (y - this.playerPosition.y) / 5;
        
        if (panner.positionX) {
            panner.positionX.value = audioX;
            panner.positionY.value = audioY;
            panner.positionZ.value = audioZ;
        } else {
            panner.setPosition(audioX, audioY, audioZ);
        }
    }
    
    /**
     * プレイヤー位置を更新（音響リスナーを移動）
     */
    updatePlayerPosition(x, y) {
        this.playerPosition = { x, y };
        
        // 全ての環境音源の相対位置を更新
        Object.values(this.ambientSources).forEach(source => {
            if (source.panner && source.worldPosition) {
                this.setPannerPosition(
                    source.panner, 
                    source.worldPosition.x, 
                    source.worldPosition.y
                );
            }
        });
    }
    
    /**
     * 足音を再生
     */
    playFootstep(surface = 'grass') {
        if (!this.isInitialized || this.isMuted) return;
        
        const frequencies = {
            grass: [100, 150],
            stone: [200, 400],
            wood: [150, 300],
            sand: [80, 120]
        };
        
        const [lowFreq, highFreq] = frequencies[surface] || frequencies.grass;
        
        // ノイズベースの足音
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        oscillator.type = 'triangle';
        oscillator.frequency.value = lowFreq + Math.random() * (highFreq - lowFreq);
        
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        
        gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
        gainNode.gain.exponentialDecayTo = 0.001;
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + 0.1);
    }
    
    /**
     * 敵の唸り声を再生（空間配置）
     */
    playEnemyGrowl(enemyX, enemyY, enemyType = 'normal') {
        if (!this.isInitialized || this.isMuted) return;
        
        const panner = this.createPanner(enemyX, enemyY);
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        // 敵タイプで音を変える
        const settings = {
            normal: { freq: 80, duration: 0.5 },
            strong: { freq: 50, duration: 0.8 },
            boss: { freq: 30, duration: 1.2 }
        };
        
        const { freq, duration } = settings[enemyType] || settings.normal;
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(freq, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, this.context.currentTime + duration);
        
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 5;
        
        gainNode.gain.setValueAtTime(0.15, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.masterGain);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    }
    
    /**
     * 環境音を開始（ループ、空間配置）
     */
    startAmbientSound(id, x, y, type = 'wind') {
        if (!this.isInitialized) return;
        
        // 既存の同IDソースを停止
        this.stopAmbientSound(id);
        
        const panner = this.createPanner(x, y, {
            maxDistance: 100,
            rolloffFactor: 0.5
        });
        
        const gainNode = this.context.createGain();
        gainNode.gain.value = 0.08;
        
        let oscillators = [];
        
        if (type === 'wind') {
            // 風の音（ホワイトノイズ + フィルター）
            const bufferSize = 2 * this.context.sampleRate;
            const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.context.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.loop = true;
            
            const filter = this.context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;
            
            const lfo = this.context.createOscillator();
            const lfoGain = this.context.createGain();
            lfo.frequency.value = 0.2;
            lfoGain.gain.value = 200;
            
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(this.masterGain);
            
            noise.start();
            lfo.start();
            
            oscillators = [noise, lfo];
            
        } else if (type === 'water') {
            // 水の音
            const bufferSize = 2 * this.context.sampleRate;
            const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.context.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.loop = true;
            
            const filter = this.context.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1000;
            filter.Q.value = 1;
            
            noise.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(this.masterGain);
            
            noise.start();
            oscillators = [noise];
            
        } else if (type === 'town') {
            // 街の環境音（低い雑踏）
            const oscillator = this.context.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = 100;
            
            const filter = this.context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 150;
            
            gainNode.gain.value = 0.03;
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(panner);
            panner.connect(this.masterGain);
            
            oscillator.start();
            oscillators = [oscillator];
        }
        
        this.ambientSources[id] = {
            oscillators,
            panner,
            gainNode,
            worldPosition: { x, y }
        };
    }
    
    /**
     * 環境音を停止
     */
    stopAmbientSound(id) {
        const source = this.ambientSources[id];
        if (source) {
            source.oscillators.forEach(osc => {
                try { osc.stop(); } catch (e) {}
            });
            delete this.ambientSources[id];
        }
    }
    
    /**
     * 全ての環境音を停止
     */
    stopAllAmbient() {
        Object.keys(this.ambientSources).forEach(id => this.stopAmbientSound(id));
    }
    
    /**
     * バトル効果音
     */
    playBattleSound(type) {
        if (!this.isInitialized || this.isMuted) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        switch (type) {
            case 'attack':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);
                break;
                
            case 'hit':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(100, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(30, this.context.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.15, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);
                break;
                
            case 'magic':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);
                break;
                
            case 'heal':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, this.context.currentTime);
                oscillator.frequency.linearRampToValueAtTime(800, this.context.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.08, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);
                break;
                
            case 'victory':
                this.playVictoryFanfare();
                return;
                
            case 'defeat':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 1);
                gainNode.gain.setValueAtTime(0.15, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 1);
                break;
        }
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        oscillator.start();
        oscillator.stop(this.context.currentTime + 1);
    }
    
    /**
     * 勝利ファンファーレ
     */
    playVictoryFanfare() {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const duration = 0.2;
        
        notes.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'square';
            osc.frequency.value = freq;
            
            const startTime = this.context.currentTime + i * duration;
            gain.gain.setValueAtTime(0.1, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 1.5);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(startTime);
            osc.stop(startTime + duration * 2);
        });
    }
    
    /**
     * UIサウンド
     */
    playUISound(type) {
        if (!this.isInitialized || this.isMuted) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.type = 'sine';
        gainNode.gain.value = 0.05;
        
        switch (type) {
            case 'select':
                oscillator.frequency.value = 600;
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
                break;
            case 'confirm':
                oscillator.frequency.value = 800;
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);
                break;
            case 'cancel':
                oscillator.frequency.value = 300;
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);
                break;
        }
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        oscillator.start();
        oscillator.stop(this.context.currentTime + 0.2);
    }
    
    /**
     * ミュート切り替え
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
        }
        return this.isMuted;
    }
    
    /**
     * リソース解放
     */
    dispose() {
        this.stopAllAmbient();
        if (this.context) {
            this.context.close();
        }
    }
}

// グローバルインスタンス
window.audioSystem = new SpatialAudioSystem();
