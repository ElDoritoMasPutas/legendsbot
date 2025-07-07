const crypto = require('crypto');
const config = require('../config/enhanced-config.js');
const Logger = require('../logging/enhanced-logger.js');

class EncryptionManager {
    constructor() {
        this.logger = new Logger('EncryptionManager');
        this.initialized = false;
        
        this.algorithms = {
            symmetric: {
                aes256gcm: 'aes-256-gcm',
                aes256cbc: 'aes-256-cbc',
                aes192gcm: 'aes-192-gcm',
                chacha20: 'chacha20-poly1305'
            },
            asymmetric: {
                rsa: 'rsa',
                ecdsa: 'ec'
            },
            hashing: {
                sha256: 'sha256',
                sha512: 'sha512',
                blake2b: 'blake2b512'
            }
        };
        
        this.defaultAlgorithm = this.algorithms.symmetric.aes256gcm;
        this.keyDerivation = {
            algorithm: 'pbkdf2',
            iterations: 100000,
            keyLength: 32,
            digest: 'sha512'
        };
        
        this.masterKey = null;
        this.derivedKeys = new Map();
        this.keyPairs = new Map();
        
        this.stats = {
            encryptionOperations: 0,
            decryptionOperations: 0,
            keyGenerations: 0,
            hashOperations: 0,
            errors: 0
        };
        
        this.sensitiveFields = new Set([
            'password', 'token', 'secret', 'key', 'apiKey',
            'webhook', 'credential', 'auth', 'private'
        ]);
    }

    async initialize() {
        try {
            this.logger.info('Initializing Encryption Manager...');
            
            // Initialize master key
            await this.initializeMasterKey();
            
            // Setup key derivation
            await this.setupKeyDerivation();
            
            // Generate default key pairs
            await this.generateDefaultKeyPairs();
            
            // Test encryption/decryption
            await this.performSelfTest();
            
            this.initialized = true;
            this.logger.info('Encryption Manager initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize Encryption Manager:', error);
            throw error;
        }
    }

    async initializeMasterKey() {
        try {
            // Get master key from configuration
            const configKey = config.security?.encryption?.key;
            
            if (configKey && configKey.length >= 32) {
                this.masterKey = Buffer.from(configKey, 'hex');
            } else {
                // Generate a new master key
                this.masterKey = crypto.randomBytes(32);
                this.logger.warn('Generated new master key - save this for production use!');
                this.logger.warn(`Master Key: ${this.masterKey.toString('hex')}`);
            }
            
            this.logger.info('Master key initialized');
            
        } catch (error) {
            this.logger.error('Failed to initialize master key:', error);
            throw error;
        }
    }

    async setupKeyDerivation() {
        try {
            // Derive keys for different purposes
            await this.deriveKey('database', 'database-encryption-key');
            await this.deriveKey('cache', 'cache-encryption-key');
            await this.deriveKey('api', 'api-encryption-key');
            await this.deriveKey('user_data', 'user-data-encryption-key');
            await this.deriveKey('logs', 'log-encryption-key');
            
            this.logger.info(`Derived ${this.derivedKeys.size} encryption keys`);
            
        } catch (error) {
            this.logger.error('Failed to setup key derivation:', error);
            throw error;
        }
    }

    async deriveKey(purpose, salt) {
        try {
            const saltBuffer = Buffer.from(salt, 'utf8');
            
            const derivedKey = crypto.pbkdf2Sync(
                this.masterKey,
                saltBuffer,
                this.keyDerivation.iterations,
                this.keyDerivation.keyLength,
                this.keyDerivation.digest
            );
            
            this.derivedKeys.set(purpose, derivedKey);
            this.stats.keyGenerations++;
            
            return derivedKey;
            
        } catch (error) {
            this.logger.error(`Failed to derive key for ${purpose}:`, error);
            throw error;
        }
    }

    async generateDefaultKeyPairs() {
        try {
            // Generate RSA key pair for asymmetric encryption
            const rsaKeyPair = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });
            
            this.keyPairs.set('rsa_default', rsaKeyPair);
            
            // Generate ECDSA key pair for signing
            const ecKeyPair = crypto.generateKeyPairSync('ec', {
                namedCurve: 'secp256k1',
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            });
            
            this.keyPairs.set('ec_default', ecKeyPair);
            
            this.logger.info(`Generated ${this.keyPairs.size} key pairs`);
            
        } catch (error) {
            this.logger.error('Failed to generate default key pairs:', error);
            throw error;
        }
    }

    async performSelfTest() {
        try {
            const testData = 'Synthia AI Encryption Test';
            
            // Test symmetric encryption
            const encrypted = await this.encryptData(testData, 'database');
            const decrypted = await this.decryptData(encrypted, 'database');
            
            if (decrypted !== testData) {
                throw new Error('Symmetric encryption self-test failed');
            }
            
            // Test asymmetric encryption
            const asymmetricEncrypted = await this.encryptAsymmetric(testData, 'rsa_default');
            const asymmetricDecrypted = await this.decryptAsymmetric(asymmetricEncrypted, 'rsa_default');
            
            if (asymmetricDecrypted !== testData) {
                throw new Error('Asymmetric encryption self-test failed');
            }
            
            // Test hashing
            const hash1 = await this.hashData(testData);
            const hash2 = await this.hashData(testData);
            
            if (hash1 !== hash2) {
                throw new Error('Hashing self-test failed');
            }
            
            this.logger.info('Encryption self-test passed');
            
        } catch (error) {
            this.logger.error('Encryption self-test failed:', error);
            throw error;
        }
    }

    // Symmetric Encryption
    async encryptData(data, keyPurpose = 'database', algorithm = this.defaultAlgorithm) {
        try {
            this.stats.encryptionOperations++;
            
            const key = this.derivedKeys.get(keyPurpose);
            if (!key) {
                throw new Error(`Encryption key not found for purpose: ${keyPurpose}`);
            }
            
            const iv = crypto.randomBytes(16); // 128-bit IV
            const cipher = crypto.createCipher(algorithm, key);
            
            let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = algorithm.includes('gcm') ? cipher.getAuthTag() : null;
            
            const result = {
                algorithm,
                iv: iv.toString('hex'),
                encrypted,
                authTag: authTag ? authTag.toString('hex') : null,
                keyPurpose,
                timestamp: Date.now()
            };
            
            return Buffer.from(JSON.stringify(result)).toString('base64');
            
        } catch (error) {
            this.stats.errors++;
            this.logger.error('Data encryption failed:', error);
            throw error;
        }
    }

    async decryptData(encryptedData, keyPurpose = 'database') {
        try {
            this.stats.decryptionOperations++;
            
            const key = this.derivedKeys.get(keyPurpose);
            if (!key) {
                throw new Error(`Decryption key not found for purpose: ${keyPurpose}`);
            }
            
            const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
            const { algorithm, iv, encrypted, authTag } = data;
            
            const decipher = crypto.createDecipher(algorithm, key);
            
            if (authTag && algorithm.includes('gcm')) {
                decipher.setAuthTag(Buffer.from(authTag, 'hex'));
            }
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
            
        } catch (error) {
            this.stats.errors++;
            this.logger.error('Data decryption failed:', error);
            throw error;
        }
    }

    // Asymmetric Encryption
    async encryptAsymmetric(data, keyPairName = 'rsa_default') {
        try {
            this.stats.encryptionOperations++;
            
            const keyPair = this.keyPairs.get(keyPairName);
            if (!keyPair) {
                throw new Error(`Key pair not found: ${keyPairName}`);
            }
            
            const encrypted = crypto.publicEncrypt(
                {
                    key: keyPair.publicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                },
                Buffer.from(JSON.stringify(data), 'utf8')
            );
            
            return {
                encrypted: encrypted.toString('base64'),
                keyPairName,
                timestamp: Date.now()
            };
            
        } catch (error) {
            this.stats.errors++;
            this.logger.error('Asymmetric encryption failed:', error);
            throw error;
        }
    }

    async decryptAsymmetric(encryptedData, keyPairName = 'rsa_default') {
        try {
            this.stats.decryptionOperations++;
            
            const keyPair = this.keyPairs.get(keyPairName);
            if (!keyPair) {
                throw new Error(`Key pair not found: ${keyPairName}`);
            }
            
            const decrypted = crypto.privateDecrypt(
                {
                    key: keyPair.privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                },
                Buffer.from(encryptedData.encrypted, 'base64')
            );
            
            return JSON.parse(decrypted.toString('utf8'));
            
        } catch (error) {
            this.stats.errors++;
            this.logger.error('Asymmetric decryption failed:', error);
            throw error;
        }
    }

    // Digital Signatures
    async signData(data, keyPairName = 'ec_default') {
        try {
            const keyPair = this.keyPairs.get(keyPairName);
            if (!keyPair) {
                throw new Error(`Key pair not found: ${keyPairName}`);
            }
            
            const sign = crypto.createSign('SHA256');
            sign.update(JSON.stringify(data));
            sign.end();
            
            const signature = sign.sign(keyPair.privateKey);
            
            return {
                data,
                signature: signature.toString('base64'),
                keyPairName,
                timestamp: Date.now()
            };
            
        } catch (error) {
            this.logger.error('Data signing failed:', error);
            throw error;
        }
    }

    async verifySignature(signedData, keyPairName = 'ec_default') {
        try {
            const keyPair = this.keyPairs.get(keyPairName);
            if (!keyPair) {
                throw new Error(`Key pair not found: ${keyPairName}`);
            }
            
            const verify = crypto.createVerify('SHA256');
            verify.update(JSON.stringify(signedData.data));
            verify.end();
            
            return verify.verify(keyPair.publicKey, Buffer.from(signedData.signature, 'base64'));
            
        } catch (error) {
            this.logger.error('Signature verification failed:', error);
            return false;
        }
    }

    // Hashing and Key Derivation
    async hashData(data, algorithm = 'sha256') {
        try {
            this.stats.hashOperations++;
            
            const hash = crypto.createHash(algorithm);
            hash.update(JSON.stringify(data));
            
            return hash.digest('hex');
            
        } catch (error) {
            this.stats.errors++;
            this.logger.error('Data hashing failed:', error);
            throw error;
        }
    }

    async hashPassword(password, salt = null) {
        try {
            const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(16);
            
            const hash = crypto.pbkdf2Sync(
                password,
                saltBuffer,
                this.keyDerivation.iterations,
                64, // 512-bit hash
                'sha512'
            );
            
            return {
                hash: hash.toString('hex'),
                salt: saltBuffer.toString('hex'),
                iterations: this.keyDerivation.iterations
            };
            
        } catch (error) {
            this.logger.error('Password hashing failed:', error);
            throw error;
        }
    }

    async verifyPassword(password, hashedPassword) {
        try {
            const { hash: expectedHash, salt, iterations } = hashedPassword;
            
            const actualHash = crypto.pbkdf2Sync(
                password,
                Buffer.from(salt, 'hex'),
                iterations,
                64,
                'sha512'
            );
            
            return crypto.timingSafeEqual(
                Buffer.from(expectedHash, 'hex'),
                actualHash
            );
            
        } catch (error) {
            this.logger.error('Password verification failed:', error);
            return false;
        }
    }

    // Utility Functions
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    generateUUID() {
        return crypto.randomUUID();
    }

    async generateNonce(length = 16) {
        return crypto.randomBytes(length).toString('hex');
    }

    // Data Protection Utilities
    async encryptSensitiveObject(obj, keyPurpose = 'user_data') {
        try {
            const result = {};
            
            for (const [key, value] of Object.entries(obj)) {
                if (this.isSensitiveField(key)) {
                    result[key] = await this.encryptData(value, keyPurpose);
                } else if (typeof value === 'object' && value !== null) {
                    result[key] = await this.encryptSensitiveObject(value, keyPurpose);
                } else {
                    result[key] = value;
                }
            }
            
            return result;
            
        } catch (error) {
            this.logger.error('Failed to encrypt sensitive object:', error);
            throw error;
        }
    }

    async decryptSensitiveObject(obj, keyPurpose = 'user_data') {
        try {
            const result = {};
            
            for (const [key, value] of Object.entries(obj)) {
                if (this.isSensitiveField(key) && typeof value === 'string') {
                    try {
                        result[key] = await this.decryptData(value, keyPurpose);
                    } catch (decryptError) {
                        // If decryption fails, assume it's not encrypted
                        result[key] = value;
                    }
                } else if (typeof value === 'object' && value !== null) {
                    result[key] = await this.decryptSensitiveObject(value, keyPurpose);
                } else {
                    result[key] = value;
                }
            }
            
            return result;
            
        } catch (error) {
            this.logger.error('Failed to decrypt sensitive object:', error);
            throw error;
        }
    }

    isSensitiveField(fieldName) {
        const lowerFieldName = fieldName.toLowerCase();
        return Array.from(this.sensitiveFields).some(sensitive => 
            lowerFieldName.includes(sensitive)
        );
    }

    addSensitiveField(fieldName) {
        this.sensitiveFields.add(fieldName.toLowerCase());
    }

    removeSensitiveField(fieldName) {
        this.sensitiveFields.delete(fieldName.toLowerCase());
    }

    // Key Management
    async rotateKeys() {
        try {
            this.logger.info('Starting key rotation...');
            
            // Generate new master key
            const oldMasterKey = this.masterKey;
            this.masterKey = crypto.randomBytes(32);
            
            // Re-derive all keys
            this.derivedKeys.clear();
            await this.setupKeyDerivation();
            
            // Generate new key pairs
            this.keyPairs.clear();
            await this.generateDefaultKeyPairs();
            
            this.logger.info('Key rotation completed successfully');
            this.logger.warn(`New Master Key: ${this.masterKey.toString('hex')}`);
            
            return {
                success: true,
                rotatedAt: new Date(),
                newMasterKey: this.masterKey.toString('hex')
            };
            
        } catch (error) {
            this.logger.error('Key rotation failed:', error);
            throw error;
        }
    }

    async exportKeyPair(keyPairName) {
        try {
            const keyPair = this.keyPairs.get(keyPairName);
            if (!keyPair) {
                throw new Error(`Key pair not found: ${keyPairName}`);
            }
            
            return {
                name: keyPairName,
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey,
                exportedAt: new Date()
            };
            
        } catch (error) {
            this.logger.error(`Failed to export key pair ${keyPairName}:`, error);
            throw error;
        }
    }

    async importKeyPair(keyPairName, publicKey, privateKey) {
        try {
            this.keyPairs.set(keyPairName, { publicKey, privateKey });
            this.logger.info(`Imported key pair: ${keyPairName}`);
            
        } catch (error) {
            this.logger.error(`Failed to import key pair ${keyPairName}:`, error);
            throw error;
        }
    }

    // Security Utilities
    async secureCompare(a, b) {
        try {
            const bufferA = Buffer.from(String(a), 'utf8');
            const bufferB = Buffer.from(String(b), 'utf8');
            
            if (bufferA.length !== bufferB.length) {
                return false;
            }
            
            return crypto.timingSafeEqual(bufferA, bufferB);
            
        } catch (error) {
            return false;
        }
    }

    async generateCSRF() {
        return this.generateSecureToken(32);
    }

    async generateSessionId() {
        return this.generateSecureToken(48);
    }

    // Memory Security
    secureWipe(buffer) {
        if (Buffer.isBuffer(buffer)) {
            buffer.fill(0);
        }
    }

    // Statistics and Monitoring
    getStats() {
        return {
            ...this.stats,
            derivedKeys: this.derivedKeys.size,
            keyPairs: this.keyPairs.size,
            sensitiveFields: this.sensitiveFields.size,
            algorithms: Object.keys(this.algorithms).length,
            initialized: this.initialized
        };
    }

    getAlgorithms() {
        return this.algorithms;
    }

    getSupportedAlgorithms() {
        return {
            symmetric: Object.values(this.algorithms.symmetric),
            asymmetric: Object.values(this.algorithms.asymmetric),
            hashing: Object.values(this.algorithms.hashing)
        };
    }

    isInitialized() {
        return this.initialized;
    }
}

module.exports = EncryptionManager;