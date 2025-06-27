// Enhanced Synthia Translator with Multi-API Support v9.0 - FIXED FOR POKEMON
const EnhancedTranslationAPI = require('../data/Translation.js');
const config = require('../config/config.js');

class SynthiaMultiTranslator {
    constructor() {
        this.enhancedAPI = new EnhancedTranslationAPI();
        this.toxicityDatabase = new Map();
        this.scamPatterns = new Set();
        this.translationStats = {
            totalTranslations: 0,
            successfulTranslations: 0,
            failedTranslations: 0,
            providerStats: {},
            averageResponseTime: 0,
            totalResponseTime: 0
        };
        
        this.initializeBypassPatterns();
        this.initializeLanguagePatterns();
        this.initializeScamPatterns();
        console.log('🚀 Synthia Multi-Translator v9.0 initialized with Pokemon-aware bypass detection');
        console.log(`🔧 Total providers: ${Object.keys(this.enhancedAPI.apis).length}`);
        console.log(`🌍 Languages supported: ${this.enhancedAPI.supportedLanguages.size}`);
        console.log('🎮 Pokemon trading protection: ENABLED');
    }

    // COMPREHENSIVE: Pokemon content detection - FIXED FOR .me AND .mysteryegg
    isPokemonRelatedContent(text) {
        const lowerContent = text.toLowerCase().trim();
        
        // 1. Pokemon file extensions
        const pokemonFilePattern = /\.(pk[3-9]|pb[78]|pa[78]|pkm|3gpkm|ck3|bk4|rk4|sk2|xk3)(\s|$)/i;
        if (pokemonFilePattern.test(text)) {
            return true;
        }
        
        // 2. Pokemon trading codes (.trade followed by numbers)
        const tradingCodePattern = /\.trade\s+\d{4,8}/i;
        if (tradingCodePattern.test(text)) {
            return true;
        }
        
        // 3. Pokemon mystery egg and .me commands (.me or .mysteryegg followed by numbers)
        const meCommandPattern = /\.me\s+\d{4,8}/i;
        const mysteryeggPattern = /\.mysteryegg\s+\d{4,8}/i;
        if (meCommandPattern.test(text) || mysteryeggPattern.test(text)) {
            return true;
        }
        
        // 4. Pokemon battle team commands
        if (lowerContent.includes('.bt ') || lowerContent.includes('.pokepaste')) {
            return true;
        }
        
        // 5. Pokemon stat terminology (2+ terms = Pokemon content)
        const pokemonTerms = [
            'shiny:', 'level:', 'ball:', 'ability:', 'nature:', 'evs:', 'ivs:', 'moves:', 'item:',
            'tera type:', 'hidden power:', 'happiness:', 'ot:', 'tid:', 'gigantamax:',
            'metlocation=', 'dusk ball', 'poke ball', 'ultra ball', 'master ball', 'beast ball',
            'adamant', 'modest', 'jolly', 'timid', 'bold', 'impish', 'careful', 'calm',
            'hasty', 'naive', 'serious', 'hardy', 'lonely', 'brave', 'relaxed', 'quiet',
            'hp:', 'attack:', 'defense:', 'sp. atk:', 'sp. def:', 'speed:', '.me', '.mysteryegg'
        ];
        
        const pokemonTermCount = pokemonTerms.filter(term => lowerContent.includes(term)).length;
        
        // 6. Common Pokemon names
        const commonPokemonNames = [
            'charizard', 'pikachu', 'mewtwo', 'mew', 'rayquaza', 'arceus', 'dialga', 'palkia',
            'giratina', 'kyogre', 'groudon', 'lugia', 'ho-oh', 'celebi', 'jirachi', 'deoxys',
            'darkrai', 'shaymin', 'victini', 'keldeo', 'meloetta', 'genesect', 'diancie',
            'hoopa', 'volcanion', 'magearna', 'marshadow', 'zeraora', 'meltan', 'melmetal',
            'zarude', 'calyrex', 'regidrago', 'regieleki', 'glastrier', 'spectrier',
            'eevee', 'vaporeon', 'jolteon', 'flareon', 'espeon', 'umbreon', 'leafeon',
            'glaceon', 'sylveon', 'lucario', 'garchomp', 'dragapult', 'mimikyu', 'toxapex',
            'ferrothorn', 'rotom', 'landorus', 'thundurus', 'tornadus', 'reshiram', 'zekrom',
            'kyurem', 'xerneas', 'yveltal', 'zygarde', 'solgaleo', 'lunala', 'necrozma',
            'zacian', 'zamazenta', 'eternatus', 'koraidon', 'miraidon', 'gimmighoul', 'gholdengo'
        ];
        
        const pokemonNameCount = commonPokemonNames.filter(name => lowerContent.includes(name)).length;
        
        // 7. Competitive Pokemon formats
        const competitiveTerms = [
            'ou', 'uu', 'ru', 'nu', 'pu', 'ubers', 'ag', 'vgc', 'bss', 'doubles',
            'smogon', 'showdown', 'teambuilder', 'tier', 'ban list', 'usage stats'
        ];
        const competitiveTermCount = competitiveTerms.filter(term => lowerContent.includes(term)).length;
        
        // COMPREHENSIVE: Multiple detection criteria - FIXED TO INCLUDE .me AND .mysteryegg
        return (
            pokemonTermCount >= 2 || // Has Pokemon stats/terms
            (lowerContent.includes('.trade') && pokemonTermCount >= 1) || // .trade with Pokemon terms
            (lowerContent.includes('.trade') && pokemonNameCount >= 1) || // .trade with Pokemon names
            (lowerContent.includes('.trade') && competitiveTermCount >= 1) || // .trade with competitive terms
            (lowerContent.includes('.me') && pokemonTermCount >= 1) || // .me with Pokemon terms
            (lowerContent.includes('.me') && pokemonNameCount >= 1) || // .me with Pokemon names
            (lowerContent.includes('.mysteryegg') && pokemonTermCount >= 1) || // .mysteryegg with Pokemon terms
            (lowerContent.includes('.mysteryegg') && pokemonNameCount >= 1) || // .mysteryegg with Pokemon names
            (lowerContent.includes('.bt') && pokemonTermCount >= 1) || // Battle team command
            (lowerContent.includes('.pokepaste') && lowerContent.includes('pokepast.es')) // Pokepaste links
        );
    }

    initializeBypassPatterns() {
        // Common character substitutions
        this.characterSubstitutions = new Map([
            ['@', 'a'], ['4', 'a'], ['∆', 'a'], ['α', 'a'], ['а', 'a'],
            ['8', 'b'], ['ß', 'b'], ['6', 'b'], ['β', 'b'], ['ь', 'b'],
            ['¢', 'c'], ['©', 'c'], ['(', 'c'], ['[', 'c'], ['с', 'c'],
            ['∂', 'd'], ['|)', 'd'], ['|>', 'd'], ['δ', 'd'], ['ď', 'd'],
            ['3', 'e'], ['€', 'e'], ['£', 'e'], ['ε', 'e'], ['е', 'e'],
            ['ƒ', 'f'], ['7', 'f'], ['|=', 'f'], ['φ', 'f'], ['ف', 'f'],
            ['9', 'g'], ['6', 'g'], ['&', 'g'], ['γ', 'g'], ['ğ', 'g'],
            ['#', 'h'], ['|-|', 'h'], [']-[', 'h'], ['η', 'h'], ['ħ', 'h'],
            ['1', 'i'], ['!', 'i'], ['|', 'i'], ['ι', 'i'], ['і', 'i'],
            ['_|', 'j'], ['¿', 'j'], ['ј', 'j'], ['ɉ', 'j'],
            ['|<', 'k'], ['|{', 'k'], ['κ', 'k'], ['к', 'k'],
            ['1', 'l'], ['|', 'l'], ['7', 'l'], ['£', 'l'], ['ł', 'l'],
            ['|\\/|', 'm'], ['|v|', 'm'], ['μ', 'm'], ['м', 'm'],
            ['|\\|', 'n'], ['|\\/', 'n'], ['ν', 'n'], ['η', 'n'],
            ['0', 'o'], ['°', 'o'], ['ο', 'o'], ['σ', 'o'], ['о', 'o'],
            ['|°', 'p'], ['|>', 'p'], ['π', 'p'], ['р', 'p'],
            ['9', 'q'], ['¶', 'q'], ['θ', 'q'],
            ['12', 'r'], ['|2', 'r'], ['ρ', 'r'], ['я', 'r'],
            ['5', 's'], ['$', 's'], ['§', 's'], ['ς', 's'], ['ѕ', 's'],
            ['7', 't'], ['+', 't'], ['†', 't'], ['τ', 't'], ['т', 't'],
            ['|_|', 'u'], ['μ', 'u'], ['υ', 'u'], ['υ', 'u'], ['и', 'u'],
            ['\\/', 'v'], ['ν', 'v'], ['ѵ', 'v'], ['ṽ', 'v'],
            ['\\/\\/', 'w'], ['ω', 'w'], ['ш', 'w'], ['ѡ', 'w'],
            ['><', 'x'], ['×', 'x'], ['χ', 'x'], ['х', 'x'],
            ['¥', 'y'], ['γ', 'y'], ['у', 'y'], ['ỳ', 'y'],
            ['2', 'z'], ['ζ', 'z'], ['з', 'z'], ['ž', 'z']
        ]);

        // Common separators used to bypass detection
        this.separators = [
            ' ', '.', '-', '_', '*', '/', '\\', '|', '+', '=', 
            '~', '`', '^', ':', ';', ',', '!', '?', '#', '%', 
            '&', '(', ')', '[', ']', '{', '}', '<', '>', '"', 
            "'", '°', '•', '·', '‐', '‑', '‒', '–', '—', '―'
        ];

        console.log('🛡️ Enhanced bypass detection patterns initialized with Pokemon protection');
    }

    initializeScamPatterns() {
        this.scamPatterns = new Set([
            'free nitro click', 'discord gift code', 'free discord nitro',
            'steam gift card free', 'free games click', 'nitro giveaway click', 
            'crypto scam', 'bitcoin investment guaranteed', 'easy money guaranteed', 
            'get rich quick', 'work from home guaranteed', 'make money online click',
            'passive income guaranteed', 'trading bot guaranteed', 'forex guaranteed profit',
            'binary options guaranteed', 'cryptocurrency investment guaranteed', 'nft free click',
            'airdrop click here', 'whitelist click now', 'presale guaranteed', 
            'double your money guaranteed', 'guaranteed profit click', 'risk free investment guaranteed',
            'no experience needed money', 'automatic money making', 'join now get rich',
            'act fast limited time money', 'exclusive offer click money', 'secret method money',
            'dm me for money', 'add me for free money', 'nitro boost free click',
            'free robux click here', 'roblox gift free click', 'minecraft gift click here',
            'steam key free click', 'game key giveaway click', 'cs:go skins free click'
        ]);
        
        console.log('🛡️ Scam patterns initialized (Pokemon trading protected)');
    }

    // COMPREHENSIVE: Bypass normalization with Pokemon awareness
    normalizeBypassAttempts(text) {
        // FIRST: Check if this is Pokemon content - if so, don't normalize
        if (this.isPokemonRelatedContent(text)) {
            console.log(`🎮 Pokemon content detected - skipping bypass normalization: "${text.slice(0, 50)}..."`);
            return text.toLowerCase();
        }

        let normalized = text.toLowerCase();
        
        // Step 1: Handle elongated characters (2+ repetitions)
        normalized = normalized.replace(/(.)\1{1,}/gi, '$1');
        
        // Step 2: Remove separators between letters
        const separatorPattern = new RegExp(`([a-zA-Z])([${this.separators.map(s => '\\' + s).join('')}])+([a-zA-Z])`, 'gi');
        normalized = normalized.replace(separatorPattern, '$1$3');
        
        // Step 3: Handle character substitutions
        for (const [substitute, original] of this.characterSubstitutions) {
            const regex = new RegExp(this.escapeRegex(substitute), 'gi');
            normalized = normalized.replace(regex, original);
        }
        
        // Step 4: Remove extra spaces between characters
        normalized = normalized.replace(/\b([a-zA-Z])\s+(?=[a-zA-Z])/g, '$1');
        
        // Step 5: Handle leetspeak and numbers (BUT NOT in Pokemon context)
        const leetSubstitutions = {
            '0': 'o', '1': 'i', '2': 'z', '3': 'e', '4': 'a',
            '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g'
        };
        
        for (const [num, letter] of Object.entries(leetSubstitutions)) {
            normalized = normalized.replace(new RegExp(num, 'g'), letter);
        }
        
        // Step 6: Handle Unicode lookalikes and special characters
        const unicodeNormalizations = {
            'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', // Cyrillic
            'α': 'a', 'β': 'b', 'γ': 'y', 'δ': 'd', 'ε': 'e', 'ζ': 'z', // Greek
            'η': 'n', 'θ': 'o', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm',
            'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's',
            'τ': 't', 'υ': 'u', 'φ': 'f', 'χ': 'x', 'ψ': 'y', 'ω': 'w'
        };
        
        for (const [unicode, ascii] of Object.entries(unicodeNormalizations)) {
            normalized = normalized.replace(new RegExp(unicode, 'g'), ascii);
        }
        
        return normalized.trim();
    }

    // FIXED: Detect bypassing attempts with Pokemon context awareness
    detectBypassAttempts(originalText, normalizedText) {
        // FIRST: Check if this is Pokemon content - if so, no bypass detection
        if (this.isPokemonRelatedContent(originalText)) {
            console.log(`🎮 Pokemon content detected - skipping bypass detection: "${originalText.slice(0, 50)}..."`);
            return [];
        }

        const bypassAttempts = [];
        
        // Check for elongation
        const elongationMatches = originalText.match(/(.)\1{2,}/gi);
        if (elongationMatches) {
            bypassAttempts.push({
                type: 'elongation',
                patterns: elongationMatches,
                severity: 2
            });
        }
        
        // Check for character substitution
        let substitutionCount = 0;
        for (const [substitute] of this.characterSubstitutions) {
            if (originalText.includes(substitute)) {
                substitutionCount++;
            }
        }
        
        if (substitutionCount > 0) {
            bypassAttempts.push({
                type: 'character_substitution',
                count: substitutionCount,
                severity: 3
            });
        }
        
        // Check for separator bypassing
        const separatorMatches = originalText.match(/[a-zA-Z][.*_\-/\\|+~^]+[a-zA-Z]/gi);
        if (separatorMatches && separatorMatches.length > 2) {
            bypassAttempts.push({
                type: 'separator_bypassing',
                patterns: separatorMatches,
                severity: 3
            });
        }
        
        // Check for excessive spacing
        const spacingMatches = originalText.match(/\b[a-zA-Z]\s+[a-zA-Z]\s+[a-zA-Z]/gi);
        if (spacingMatches) {
            bypassAttempts.push({
                type: 'spacing_bypassing',
                patterns: spacingMatches,
                severity: 2
            });
        }
        
        // FIXED: Check for leetspeak (but exclude Pokemon trading codes)
        const leetMatches = originalText.match(/[a-zA-Z]*[0-9]+[a-zA-Z]*/gi);
        if (leetMatches && leetMatches.length > 0) {
            // Filter out Pokemon trading codes and .me/.mysteryegg commands
            const nonPokemonLeetMatches = leetMatches.filter(match => {
                // Don't flag if it's a trading code pattern
                return !(/\.trade\s+\d{4,8}/i.test(originalText) && /^\d{4,8}$/.test(match)) &&
                       !(/\.me\s+\d{4,8}/i.test(originalText) && /^\d{4,8}$/.test(match)) &&
                       !(/\.mysteryegg\s+\d{4,8}/i.test(originalText) && /^\d{4,8}$/.test(match));
            });
            
            if (nonPokemonLeetMatches.length > 0) {
                bypassAttempts.push({
                    type: 'leetspeak',
                    patterns: nonPokemonLeetMatches,
                    severity: 2
                });
            }
        }
        
        return bypassAttempts;
    }

    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    detectLanguage(text) {
        return this.enhancedAPI.detectLanguage(text);
    }

    // COMPREHENSIVE Multi-Language Patterns
    initializeLanguagePatterns() {
        this.initializeEnglishPatterns();
        this.initializeSpanishPatterns();
        this.initializeFrenchPatterns();
        this.initializeGermanPatterns();
        this.initializeRussianPatterns();
        this.initializePortuguesePatterns();
        this.initializeItalianPatterns();
        this.initializeJapanesePatterns();
        this.initializeChinesePatterns();
        this.initializeArabicPatterns();
        this.initializeHindiPatterns();
        this.initializeDutchPatterns();
        this.initializePolishPatterns();
        this.initializeTurkishPatterns();
        this.initializeKoreanPatterns();
        this.initializeSwedishPatterns();
        this.initializeNorwegianPatterns();
        this.initializeDanishPatterns();
        this.initializeFinnishPatterns();
        this.initializeCzechPatterns();
        this.initializeHungarianPatterns();
        this.initializeRomanianPatterns();
        this.initializeBulgarianPatterns();
        this.initializeCroatianPatterns();
        this.initializeSerbianPatterns();
        this.initializeUkrainianPatterns();
        this.initializeGreekPatterns();
        this.initializeHebrewPatterns();
        this.initializeThaiPatterns();
        this.initializeVietnamesePatterns();
        this.initializeIndonesianPatterns();
        
        console.log(`🧠 COMPREHENSIVE: Initialized Pokemon-aware toxicity patterns for ${this.toxicityDatabase.size} languages`);
    }

    // ENHANCED ENGLISH PATTERNS with comprehensive bypass detection - FIXED REGEX
    initializeEnglishPatterns() {
        const patterns = [];
        
        // SEVERE THREATS (Weight 6-7) - with ALL bypass variants
        const severeThreats = [
            // Kill yourself variants
            'kill yourself', 'k y s', 'k.y.s', 'k*y*s', 'k_y_s', 'k-y-s', 'k/y/s', 'k\\y\\s',
            'kys', 'ky5', 'k¥s', 'κγs', 'кγs', 'k!ll yourself',
            'k1ll yourself', 'ki11 yourself', 'kill y0urself', 'kill your5elf',
            'k!11 yourself', 'кill yourself', 'кys', 'κys',
            
            // Hang yourself variants
            'hang yourself', 'h4ng yourself', 'h@ng yourself', 'hang y0urself',
            'hang your5elf', 'h*ng yourself', 'h_ng yourself', 'hang*yourself',
            
            // Suicide variants
            'commit suicide', 'c0mmit suicide', 'comm1t suicide', 'commit su1cide',
            'commit suic1de', 'c*mmit suicide', 'commit*suicide', 'commit_suicide',
            
            // Die variants
            'go die', 'g0 die', 'go d1e', 'go*die', 'go_die', 'go-die',
            'you should die', 'y0u should die', 'you sh0uld die', 'you should d1e',
            'you*should*die', 'you_should_die', 'you-should-die',
            'die bitch', 'd1e bitch', 'die b1tch', 'die*bitch', 'die_bitch',
            'end your life', 'end y0ur life', 'end your l1fe', 'end*your*life'
        ];
        
        for (const threat of severeThreats) {
            const basePattern = threat.replace(/[*_\s\-\.]/g, '[\\s\\*\\_\\-\\.\\|\\+\\~\\^]*');
            patterns.push({ 
                pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), 
                weight: 6,
                category: 'severe_threat'
            });
        }
        
        // EXTREME SLURS (Weight 5-6) - with ALL bypass variants - FIXED REGEX
        const extremeSlurs = [
            // N-word variants (comprehensive)
            'nigger', 'n1gger', 'n!gger', 'n*gger', 'n_gger', 'n-gger', 'n.gger',
            'nig*er', 'nigg*r', 'ni**er', 'n**ger', 'n***er', 'nιgger',
            'пigger', 'ηigger', 'ռigger', 'ñigger', 'ńigger', 'nigga',
            'n1gga', 'ni**a', 'n!gga', 'niqqa', 'nyqqa', 'niqqer',
            
            // F-word slur variants
            'faggot', 'f4ggot', 'f@ggot', 'f*ggot', 'f_ggot', 'f-ggot', 'f.ggot',
            'fag*ot', 'fagg*t', 'fa**ot', 'f**got', 'f***ot', 'fαggot',
            'fаggot', 'ƒaggot', 'fagget', 'f4gget', 'f@gget', 'phag',
            'ph4g', 'ph@g', 'f4g', 'f@g', 'fhag', 'faq', 'fahg',
            
            // R-word variants
            'retard', 'ret4rd', 'ret@rd', 'ret*rd', 'ret_rd', 'ret-rd', 'ret.rd',
            'reta*d', 'retar*', 're*ard', 'r*tard', 'r**ard', 'retαrd',
            'rеtard', 'ŕetard', 'ɾetard', 'ret4rded', 'ret@rded',
            
            // Other extreme slurs
            'tranny', 'tr4nny', 'tr@nny', 'tr*nny', 'tr_nny', 'tran*y',
            'tr*nny', 'trαnny', 'trаnny', 'spic', 'sp1c', 'sp!c',
            'kike', 'k1ke', 'k!ke', 'chink', 'ch1nk', 'ch!nk'
        ];
        
        for (const slur of extremeSlurs) {
            const basePattern = slur.replace(/[*_@\-\.]/g, '[a-z0-9\\*\\_\\@\\-\\.\\|\\+]*?');
            patterns.push({ 
                pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), 
                weight: 5,
                category: 'extreme_slur'
            });
        }
        
        // SEVERE PROFANITY (Weight 3-4) - with bypass variants
        const severeProfanity = [
            // Fuck you variants
            'fuck you', 'f*ck you', 'f_ck you', 'fu*k you', 'f u c k you',
            'f.u.c.k you', 'f-u-c-k you', 'fuk you', 'fuq you', 'fvck you',
            'f0ck you', 'fцck you', 'ƒuck you', 'fuck y0u', 'fuck u',
            'fck you', 'fuk u', 'fuq u', 'f*ck u', 'f_ck u',
            
            // Fucking idiot variants
            'fucking idiot', 'f*cking idiot', 'f_cking idiot', 'fuking idiot',
            'f***ing idiot', 'f ucking idiot', 'fking idiot', 'effing idiot',
            
            // Piece of shit variants
            'piece of shit', 'piece of sh*t', 'piece of sh_t', 'piece of sht',
            'piece*of*shit', 'piece_of_shit', 'piece-of-shit', 'pos',
            
            // Motherfucker variants
            'motherfucker', 'mother f*cker', 'motherf*cker', 'motherf_cker',
            'mother fucker', 'm*therfucker', 'mofo', 'm0fo', 'mf', 'mfer',
            
            // Go to hell variants
            'go to hell', 'go 2 hell', 'g0 to hell', 'go*to*hell', 'gth',
            
            // Asshole variants
            'asshole', 'a*shole', 'a_shole', 'ass hole', 'a**hole',
            'assh0le', 'αsshole', 'аsshole', '@sshole', '4sshole',
            
            // Dickhead variants
            'dickhead', 'd*ckhead', 'd_ckhead', 'dick head', 'd**khead',
            'dickh3ad', 'dickhe4d', 'dhead', 'd!ckhead', 'dіckhead',
            
            // Cunt variants
            'cunt', 'c*nt', 'c_nt', 'cu*t', 'cυnt', 'сunt', 'ċunt',
            'c0nt', 'cnut', 'cnt', 'see you next tuesday',
            
            // Whore variants
            'whore', 'wh*re', 'wh_re', 'who*e', 'wh0re', 'whοre',
            'hore', 'h0re', 'hor', 'w h o r e',
            
            // Slut variants
            'slut', 'sl*t', 'sl_t', 'slu*', 's l u t', 'sl0t',
            'slυt', 'ѕlut', '$lut', '5lut',
            
            // Bitch ass variants
            'bitch ass', 'b*tch ass', 'bitch a*s', 'b*tch a*s',
            'bitchass', 'b!tch ass', 'bytch ass'
        ];
        
        for (const profanity of severeProfanity) {
            const basePattern = profanity.replace(/[*_\s\-\.]/g, '[a-z0-9\\*\\_\\-\\.\\s\\|\\+]*?');
            patterns.push({ 
                pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), 
                weight: 3,
                category: 'severe_profanity'
            });
        }
        
        // MODERATE PROFANITY (Weight 2) - with bypass variants - FIXED REGEX
        const moderateProfanity = [
            // Fuck variants
            'fuck', 'f*ck', 'f_ck', 'fck', 'fuk', 'fuq', 'fvck', 'f0ck',
            'fцck', 'ƒuck', 'fμck', 'phuck', 'ph*ck', 'fawk', 'fawq',
            'fuuuck', 'fuuuuck', 'fuuuuuck', 'f***', 'f**k',
            
            // Shit variants
            'shit', 'sh*t', 'sh_t', 'sht', 'shyt', 'shiet', 'sh1t',
            'sh!t', 'shіt', 'ѕhit', '$hit', '5hit', 'shite', 'sh*te',
            'shiiiit', 'shiiiiit', 'sh**', 'poop', 'crap',
            
            // Damn variants
            'damn', 'd*mn', 'd_mn', 'damm', 'dammit', 'damnit', 'd4mn',
            'dαmn', 'dаmn', 'dayum', 'dayum', 'dam', 'dmn',
            
            // Hell variants
            'hell', 'h*ll', 'h_ll', 'hel', 'h3ll', 'h311', 'hеll',
            'ħell', 'ɦell', 'what the hell', 'wth',
            
            // Bitch variants
            'bitch', 'b*tch', 'b_tch', 'btch', 'biatch', 'bytch', 'b1tch',
            'b!tch', 'bіtch', 'ƅitch', 'beach', 'be*ch', 'b***h',
            'bicth', 'betch', 'beotch', 'biotch',
            
            // Ass variants
            'ass', 'a*s', 'a_s', 'arse', 'a**', 'a55', '@ss', '4ss',
            'αss', 'аss', 'butt', 'booty', 'behind',
            
            // Dick variants
            'dick', 'd*ck', 'd_ck', 'dck', 'dik', 'diq', 'd1ck', 'd!ck',
            'dіck', 'ԁick', 'richard', 'penis', 'member',
            
            // Pussy variants
            'pussy', 'p*ssy', 'p_ssy', 'pssy', 'pu**y', 'pus*y', 'p0ssy',
            'pυssy', 'рussy', 'pusssy', 'pussi', 'cooch', 'vajayjay',
            
            // Bastard variants
            'bastard', 'b*stard', 'b_stard', 'bstrd', 'ba*tard', 'bast*rd',
            'b4stard', 'bαstard', 'ƅastard', 'buzztard',
            
            // Other moderate
            'piss', 'p*ss', 'p_ss', 'p!ss', 'р!ss', 'pee', 'whiz',
            'dumbass', 'dumb*ss', 'dumb a*s', 'dumb@ss', 'dumb4ss'
        ];
        
        for (const profanity of moderateProfanity) {
            const basePattern = profanity.replace(/[*_]/g, '[a-z0-9\\*\\_\\-\\.]??');
            patterns.push({ 
                pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), 
                weight: 2,
                category: 'moderate_profanity'
            });
        }
        
        // MILD INSULTS (Weight 1) - with bypass variants
        const mildInsults = [
            'idiot', 'id*ot', 'id_ot', '1diot', 'idi0t', 'idі0t', 'ιdiot',
            'stupid', 'st*pid', 'st_pid', 'stup*d', 'stu**d', 'st0pid',
            'moron', 'm*ron', 'm_ron', 'mor*n', 'm0ron', 'mor0n',
            'dumb', 'd*mb', 'd_mb', 'dum*', 'dυmb', 'ԁumb',
            'pathetic', 'p*thetic', 'path*tic', 'pathеtic',
            'worthless', 'w*rthless', 'worth*ess', 'worthlеss',
            'loser', 'l*ser', 'los*r', 'l0ser', 'l05er',
            'trash', 'tr*sh', 'tr_sh', 'tra5h', 'garbage',
            'scum', 'sc*m', 'sc_m', '5cum', 'waste'
        ];
        
        for (const insult of mildInsults) {
            const basePattern = insult.replace(/[*_\s]/g, '[a-z0-9\\*\\_\\-\\.\\s]*?');
            patterns.push({ 
                pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), 
                weight: 1,
                category: 'mild_insult'
            });
        }
        
        this.toxicityDatabase.set('en', {
            patterns: patterns,
            commonWords: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at'],
            culturalSensitivity: 'medium'
        });
    }

    // ENHANCED SPANISH PATTERNS
    initializeSpanishPatterns() {
        const patterns = [];
        
        // Severe threats with bypass variants
        const severeContent = [
            'matate', 'mata*e', 'mat_te', 'm*tate', 'mátate', 'mat4te',
            'suicidate', 'su*cidate', 'suic*date', 'suicídate',
            'vete a morir', 'v*te a morir', 'vete a m*rir', 'vete*a*morir',
            'murete', 'muer*te', 'mué*ete', 'muere*e'
        ];
        
        for (const content of severeContent) {
            const basePattern = content.replace(/[*_\s]/g, '[a-zA-ZáéíóúñÁÉÍÓÚÑ\\*\\_\\-\\.\\s]*?');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 6 });
        }
        
        // Severe profanity with bypass variants
        const severeContent2 = [
            'hijo de puta', 'h*jo de puta', 'hijo de p*ta', 'hijo*de*puta', 'hdp',
            'vete a la mierda', 'v*te a la mierda', 'vete*a*la*mierda',
            'que te jodan', 'que te j*dan', 'que*te*jodan',
            'jodete', 'jode*e', 'jód*te', 'j*dete',
            'cabron', 'cabrón', 'cabr*n', 'cabr_n', 'cab*on', 'c*bron'
        ];
        
        for (const content of severeContent2) {
            const basePattern = content.replace(/[*_\s]/g, '[a-zA-ZáéíóúñÁÉÍÓÚÑ\\*\\_\\-\\.\\s]*?');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 4 });
        }
        
        // Moderate profanity with bypass variants
        const moderateContent = [
            'puta', 'p*ta', 'p_ta', 'put*', 'pu*a', 'p0ta', 'putα',
            'mierda', 'mi*rda', 'mi_rda', 'mie*da', 'm*erda', 'mi3rda',
            'joder', 'jod*r', 'jod_r', 'jo*er', 'j*der', 'j0der',
            'pendejo', 'pend*jo', 'pend_jo', 'pen*ejo', 'p*ndejo',
            'coño', 'co*o', 'coñ*', 'c*ño', 'con*', 'cοño',
            'gilipollas', 'gilip*llas', 'gili*ollas', 'gil*pollas'
        ];
        
        for (const content of moderateContent) {
            const basePattern = content.replace(/[*_]/g, '[a-zA-ZáéíóúñÁÉÍÓÚÑ\\*\\_\\-\\.]??');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 2 });
        }
        
        this.toxicityDatabase.set('es', {
            patterns: patterns,
            commonWords: ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se'],
            culturalSensitivity: 'high'
        });
    }

    // Continue with all other language patterns...
    initializeFrenchPatterns() {
        const patterns = [];
        
        const severeContent = [
            'tue toi', 'tue*oi', 'tu* toi', 'tue-toi', 'tues-toi',
            'suicide toi', 'suicide*oi', 'suicide-toi',
            'va mourir', 'v* mourir', 'va m*urir', 'va*mourir',
            'creve', 'crève', 'cr*ve', 'crev*', 'cr3ve'
        ];
        
        for (const content of severeContent) {
            const basePattern = content.replace(/[*_\s\-]/g, '[a-zA-ZàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ\\*\\_\\-\\.\\s]*?');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 6 });
        }
        
        const moderateContent = [
            'merde', 'm*rde', 'm_rde', 'mer*e', 'm3rde', 'mеrde',
            'putain', 'put*in', 'put_in', 'puta*n', 'p*tain',
            'con', 'c*n', 'cοn', 'сon', 'connard', 'conn*rd',
            'salope', 'sal*pe', 'sal_pe', 'salo*e', 's*lope',
            'bordel', 'bord*l', 'bor*el', 'b*rdel'
        ];
        
        for (const content of moderateContent) {
            const basePattern = content.replace(/[*_]/g, '[a-zA-ZàâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ\\*\\_\\-\\.]??');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 2 });
        }
        
        this.toxicityDatabase.set('fr', {
            patterns: patterns,
            commonWords: ['le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir'],
            culturalSensitivity: 'medium'
        });
    }

    initializeGermanPatterns() {
        const patterns = [];
        
        const severeContent = [
            'bring dich um', 'bring*ich um', 'br*ng dich um', 'bring-dich-um',
            'töte dich', 'töt* dich', 'tö*e dich', 'töte-dich',
            'stirb', 'st*rb', 'st_rb', 'stir*', '5tirb', 'ѕtirb'
        ];
        
        for (const content of severeContent) {
            const basePattern = content.replace(/[*_\s\-]/g, '[a-zA-ZäöüßÄÖÜ\\*\\_\\-\\.\\s]*?');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 6 });
        }
        
        const moderateContent = [
            'scheiße', 'sche*ße', 'sch*iße', 'schei*e', 'sch3iße',
            'scheisse', 'sche*sse', 'schei*se', 'sch*isse',
            'fick', 'f*ck', 'f_ck', 'fіck', 'ƒick', 'fісk',
            'arsch', 'a*sch', 'a_sch', 'ar*ch', 'αrsch',
            'hurensohn', 'huren*ohn', 'h*rensohn', 'hurens*hn'
        ];
        
        for (const content of moderateContent) {
            const basePattern = content.replace(/[*_]/g, '[a-zA-ZäöüßÄÖÜ\\*\\_\\-\\.]??');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 2 });
        }
        
        this.toxicityDatabase.set('de', {
            patterns: patterns,
            commonWords: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das'],
            culturalSensitivity: 'high'
        });
    }

    initializeRussianPatterns() {
        const patterns = [];
        
        const severeContent = [
            'убей себя', 'уб*й себя', 'у*ей себя', 'убей*ебя',
            'повесься', 'пов*сься', 'по*есься', 'повеѕься',
            'сдохни', 'сд*хни', 'с*охни', 'сдохηи'
        ];
        
        for (const content of severeContent) {
            const basePattern = content.replace(/[*_\s]/g, '[а-яёА-ЯЁ\\*\\_\\-\\.\\s]*?');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 6 });
        }
        
        const moderateContent = [
            'сука', 'с*ка', 'с_ка', 'сυка', 'ѕука', 'суκа',
            'блядь', 'бл*дь', 'бл_дь', 'бля*ь', 'блядь', 'блyдь',
            'хуй', 'х*й', 'х_й', 'хυй', 'χуй', 'xyй',
            'пизда', 'п*зда', 'пи*да', 'піɜда', 'пιзда',
            'говно', 'г*вно', 'го*но', 'гοвно', 'гoвно'
        ];
        
        for (const content of moderateContent) {
            const basePattern = content.replace(/[*_]/g, '[а-яёА-ЯЁ\\*\\_\\-\\.]??');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 2 });
        }
        
        this.toxicityDatabase.set('ru', {
            patterns: patterns,
            commonWords: ['и', 'в', 'не', 'на', 'я', 'быть', 'он', 'с'],
            culturalSensitivity: 'high'
        });
    }

    initializePortuguesePatterns() {
        const patterns = [];
        
        const severeContent = [
            'se mata', 'se*ata', 's* mata', 'se-mata',
            'vai morrer', 'v*i morrer', 'vai m*rrer', 'vai*morrer',
            'suicida', 'su*cida', 'suic*da', 'suicіda'
        ];
        
        for (const content of severeContent) {
            const basePattern = content.replace(/[*_\s\-]/g, '[a-zA-ZáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ\\*\\_\\-\\.\\s]*?');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 6 });
        }
        
        const moderateContent = [
            'merda', 'm*rda', 'm_rda', 'mer*a', 'mеrda',
            'porra', 'p*rra', 'por*a', 'p*rra', 'pοrra',
            'caralho', 'car*lho', 'cara*ho', 'c*ralho',
            'puta', 'p*ta', 'pu*a', 'pυta', 'рuta',
            'cu', 'c*', 'сu', 'ςu'
        ];
        
        for (const content of moderateContent) {
            const basePattern = content.replace(/[*_]/g, '[a-zA-ZáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ\\*\\_\\-\\.]??');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 2 });
        }
        
        this.toxicityDatabase.set('pt', {
            patterns: patterns,
            commonWords: ['o', 'de', 'e', 'a', 'que', 'em', 'ser', 'um'],
            culturalSensitivity: 'medium'
        });
    }

    initializeItalianPatterns() {
        const patterns = [];
        
        const severeContent = [
            'ucciditi', 'uccid*ti', 'ucc*diti', 'uccidіti',
            'ammazzati', 'ammaz*ati', 'amm*zzati', 'ammazzatі',
            'crepa', 'cr*pa', 'cre*a', 'сrepa'
        ];
        
        for (const content of severeContent) {
            const basePattern = content.replace(/[*_\s]/g, '[a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\\*\\_\\-\\.\\s]*?');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 6 });
        }
        
        const moderateContent = [
            'merda', 'm*rda', 'mer*a', 'mеrda',
            'cazzo', 'c*zzo', 'caz*o', 'сazzo',
            'stronzo', 'str*nzo', 'stro*zo', 'ѕtronzo',
            'puttana', 'putt*na', 'put*ana', 'рuttana',
            'figa', 'f*ga', 'fi*a', 'fіga'
        ];
        
        for (const content of moderateContent) {
            const basePattern = content.replace(/[*_]/g, '[a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\\*\\_\\-\\.]??');
            patterns.push({ pattern: new RegExp(`\\b${basePattern}\\b`, 'gi'), weight: 2 });
        }
        
        this.toxicityDatabase.set('it', {
            patterns: patterns,
            commonWords: ['il', 'di', 'e', 'la', 'che', 'è', 'un', 'a'],
            culturalSensitivity: 'high'
        });
    }

    initializeJapanesePatterns() {
        const patterns = [
            { pattern: /死ね|殺す|自殺しろ|死んで|殺して/gi, weight: 6 },
            { pattern: /バカ|馬鹿|ばか|アホ|あほ|クソ|くそ|ちくしょう|畜生/gi, weight: 2 },
            { pattern: /ブス|デブ|でぶ|きもい|キモい|気持ち悪い/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('ja', {
            patterns: patterns,
            commonWords: ['の', 'に', 'は', 'を', 'た', 'が', 'で'],
            culturalSensitivity: 'very high'
        });
    }

    initializeChinesePatterns() {
        const patterns = [
            { pattern: /去死|他妈的|杀死你|死吧|滚蛋/gi, weight: 6 },
            { pattern: /傻逼|操|妈的|混蛋|王八蛋|狗屎|白痴|垃圾/gi, weight: 2 },
            { pattern: /白痴|蠢货|笨蛋|傻瓜|弱智/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('zh', {
            patterns: patterns,
            commonWords: ['的', '一', '是', '在', '了', '有', '和'],
            culturalSensitivity: 'very high'
        });
    }

    initializeArabicPatterns() {
        const patterns = [
            { pattern: /اقتل نفسك|موت|اذهب للجحيم|امت|اموت/gi, weight: 6 },
            { pattern: /كلب ابن كلب|لعنة عليك|يلعن ابوك/gi, weight: 4 },
            { pattern: /كلب|حمار|غبي|احمق|قذر|وسخ/gi, weight: 2 },
            { pattern: /مجنون|أحمق|غبي/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('ar', {
            patterns: patterns,
            commonWords: ['في', 'من', 'إلى', 'على', 'هذا'],
            culturalSensitivity: 'very high'
        });
    }

    initializeHindiPatterns() {
        const patterns = [
            { pattern: /मर जा|खुद को मार डाल|जहन्नुम में जा|मौत हो जा/gi, weight: 6 },
            { pattern: /मादरचोद|भोसड़ी के|रंडी|हरामी|कमीने/gi, weight: 4 },
            { pattern: /चुतिया|गांडू|साला|कमीना|हरामखोर/gi, weight: 2 },
            { pattern: /बेवकूफ|गधा|मूर्ख|अहमक/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('hi', {
            patterns: patterns,
            commonWords: ['के', 'है', 'में', 'की', 'एक'],
            culturalSensitivity: 'high'
        });
    }

    initializeDutchPatterns() {
        const patterns = [
            { pattern: /\b(ga\s*dood|sterf|vermoord\s*jezelf)\b/gi, weight: 6 },
            { pattern: /\b(kut|shit|klootzak|hoer|neuken|kanker|tering|godverdomme)\b/gi, weight: 2 },
            { pattern: /\b(idioot|stom|dom|sukkel)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('nl', {
            patterns: patterns,
            commonWords: ['de', 'het', 'een', 'van', 'in', 'voor'],
            culturalSensitivity: 'medium'
        });
    }

    initializePolishPatterns() {
        const patterns = [
            { pattern: /\b(zabij\s*się|umieraj|idź\s*do\s*diabła)\b/gi, weight: 6 },
            { pattern: /\b(kurwa|gówno|chuj|pierdolić|zajebać|skurwysyn|suka|dziwka)\b/gi, weight: 2 },
            { pattern: /\b(idiota|głupi|debil|kretyn)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('pl', {
            patterns: patterns,
            commonWords: ['i', 'w', 'nie', 'na', 'to', 'jest'],
            culturalSensitivity: 'medium'
        });
    }

    initializeTurkishPatterns() {
        const patterns = [
            { pattern: /\b(öl|kendini\s*öldür|git\s*öl|cehennemde\s*yan)\b/gi, weight: 6 },
            { pattern: /\b(amk|orospu|piç|siktir|götünü|sikeyim|ananı|amına|koyayım)\b/gi, weight: 2 },
            { pattern: /\b(aptal|salak|gerizekalı|mal)\b/gi, weight: 1 }
        ];
        
        this.toxicityDatabase.set('tr', {
            patterns: patterns,
            commonWords: ['ve', 'bir', 'bu', 'şu', 'o', 'var'],
            culturalSensitivity: 'high'
        });
    }

    initializeKoreanPatterns() {
        const patterns = [
            { pattern: /죽어|죽*어|시발|ㅅㅂ|자살해|뒤져/gi, weight: 6 },
            { pattern: /개새끼|개*새끼|개색기|씨발|씨*발/gi, weight: 4 },
            { pattern: /병신|병*신|ㅂㅅ|바보|멍청이/gi, weight: 3 }
        ];
        
        this.toxicityDatabase.set('ko', {
            patterns: patterns,
            commonWords: ['이', '가', '은', '는', '을', '를'],
            culturalSensitivity: 'very high'
        });
    }

    initializeSwedishPatterns() {
        const patterns = [
            { pattern: /\b(dö|död|ta\s*livet\s*av\s*dig)\b/gi, weight: 6 },
            { pattern: /\b(fan|skit|fitta|kuk|helvete|jävla|hora|knulla)\b/gi, weight: 2 },
            { pattern: /\b(idiot|dum|korkad)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('sv', { 
            patterns, 
            commonWords: ['och', 'en', 'ett'], 
            culturalSensitivity: 'medium' 
        });
    }

    initializeNorwegianPatterns() {
        const patterns = [
            { pattern: /\b(dø|drep\s*deg\s*selv|ta\s*livet\s*av\s*deg)\b/gi, weight: 6 },
            { pattern: /\b(faen|dritt|fitte|pikk|helvete|jævla|hore|knulle)\b/gi, weight: 2 },
            { pattern: /\b(idiot|dum|tulling)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('no', { 
            patterns, 
            commonWords: ['og', 'en', 'et'], 
            culturalSensitivity: 'medium' 
        });
    }

    initializeDanishPatterns() {
        const patterns = [
            { pattern: /\b(dø|dræb\s*dig\s*selv|tag\s*livet\s*af\s*dig)\b/gi, weight: 6 },
            { pattern: /\b(fanden|lort|kusse|pik|helvede|fucking|luder|kneppe)\b/gi, weight: 2 },
            { pattern: /\b(idiot|dum|tosset)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('da', { 
            patterns, 
            commonWords: ['og', 'en', 'et'], 
            culturalSensitivity: 'medium' 
        });
    }

    initializeFinnishPatterns() {
        const patterns = [
            { pattern: /\b(kuole|tapa\s*itsesi|mene\s*helvettiin)\b/gi, weight: 6 },
            { pattern: /\b(paska|vittu|saatana|perkele|helvetti|huora|nussii)\b/gi, weight: 2 },
            { pattern: /\b(tyhmä|idiootti|hullu)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('fi', { 
            patterns, 
            commonWords: ['ja', 'on', 'ei'], 
            culturalSensitivity: 'medium' 
        });
    }

    initializeCzechPatterns() {
        const patterns = [
            { pattern: /\b(zabij\s*se|umři|jdi\s*do\s*pekla)\b/gi, weight: 6 },
            { pattern: /\b(hovno|kurva|píča|čůrák|zasranej|děvka|jebat)\b/gi, weight: 2 },
            { pattern: /\b(idiot|hlupák|debil)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('cs', { 
            patterns, 
            commonWords: ['a', 'je', 'není'], 
            culturalSensitivity: 'medium' 
        });
    }

    initializeHungarianPatterns() {
        const patterns = [
            { pattern: /\b(halj\s*meg|öld\s*meg\s*magad|menj\s*a\s*pokolba)\b/gi, weight: 6 },
            { pattern: /\b(szar|kurva|fasz|geci|picsa|baszd|meg|faszt|anyád)\b/gi, weight: 2 },
            { pattern: /\b(idióta|hülye|ostoba)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('hu', { 
            patterns, 
            commonWords: ['és', 'egy', 'ez'], 
            culturalSensitivity: 'medium' 
        });
    }

    initializeRomanianPatterns() {
        const patterns = [
            { pattern: /\b(mori|omoară\-te|du\-te\s*în\s*iad)\b/gi, weight: 6 },
            { pattern: /\b(rahat|pulă|muie|futut|curvă|pizda|bagă|mă|în)\b/gi, weight: 2 },
            { pattern: /\b(idiot|prost|tâmpit)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('ro', { 
            patterns, 
            commonWords: ['și', 'un', 'o'], 
            culturalSensitivity: 'medium' 
        });
    }

    initializeBulgarianPatterns() {
        const patterns = [
            { pattern: /\b(умри|убий\s*се|иди\s*в\s*ада)\b/gi, weight: 6 },
            { pattern: /\b(лайно|курва|мръсник|путка)\b/gi, weight: 2 },
            { pattern: /\b(идиот|глупак|тъп)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('bg', { 
            patterns, 
            commonWords: ['и', 'е', 'на'], 
            culturalSensitivity: 'medium' 
        });
    }

    initializeCroatianPatterns() {
        const patterns = [
            { pattern: /\b(umri|ubij\s*se|idi\s*u\s*pakao)\b/gi, weight: 6 },
            { pattern: /\b(govno|kurva|pička|jebem|sranje|pizda)\b/gi, weight: 2 },
            { pattern: /\b(idiot|glup|budala)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('hr', { 
            patterns, 
            commonWords: ['i', 'je', 'u'], 
            culturalSensitivity: 'medium' 
        });
    }

    initializeSerbianPatterns() {
        const patterns = [
            { pattern: /\b(умри|убиј\s*се|иди\s*у\s*пакао)\b/gi, weight: 6 },
            { pattern: /\b(говно|курва|пичка|јебем|срање)\b/gi, weight: 2 },
            { pattern: /\b(идиот|глуп|будала)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('sr', { 
            patterns, 
            commonWords: ['и', 'је', 'у'], 
            culturalSensitivity: 'medium' 
        });
    }

    initializeUkrainianPatterns() {
        const patterns = [
            { pattern: /\b(помри|вбий\s*себе|йди\s*в\s*пекло)\b/gi, weight: 6 },
            { pattern: /\b(лайно|сука|блядь|хуй|пизда)\b/gi, weight: 2 },
            { pattern: /\b(ідіот|дурень|тупий)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('uk', { 
            patterns, 
            commonWords: ['і', 'у', 'на'], 
            culturalSensitivity: 'high' 
        });
    }

    initializeGreekPatterns() {
        const patterns = [
            { pattern: /\b(πεθανε|σκοτώσου|πάνε\s*στον\s*διάβολο)\b/gi, weight: 6 },
            { pattern: /\b(σκατά|μαλάκας|γαμώ|πουτάνα|αρχίδι)\b/gi, weight: 2 },
            { pattern: /\b(βλάκας|χαζός|κρετίνος)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('el', { 
            patterns, 
            commonWords: ['και', 'ο', 'η'], 
            culturalSensitivity: 'medium' 
        });
    }

    initializeHebrewPatterns() {
        const patterns = [
            { pattern: /\b(מות|הרוג\s*את\s*עצמך|לך\s*לגיהנום)\b/gi, weight: 6 },
            { pattern: /\b(חרא|זונה|כוס|זין|שרמוטה)\b/gi, weight: 2 },
            { pattern: /\b(אידיוט|טיפש|מטומטם)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('he', { 
            patterns, 
            commonWords: ['את', 'של', 'על'], 
            culturalSensitivity: 'very high' 
        });
    }

    initializeThaiPatterns() {
        const patterns = [
            { pattern: /ตาย|ฆ่าตัวตาย|ไปตาย|ไปนรก/gi, weight: 6 },
            { pattern: /ไอ้สัตว์|ไอ้ห*ว|อีสัตว์|สัส|ระยำ/gi, weight: 3 },
            { pattern: /กู|ก*|ķู|มึง|ม*ง|μึง/gi, weight: 2 }
        ];
        this.toxicityDatabase.set('th', { 
            patterns, 
            commonWords: ['ที่', 'และ', 'ใน'], 
            culturalSensitivity: 'very high' 
        });
    }

    initializeVietnamesePatterns() {
        const patterns = [
            { pattern: /\b(chết\s*đi|tự\s*tử|xuống\s*địa\s*ngục)\b/gi, weight: 6 },
            { pattern: /\b(đụ|cặc|lồn|đĩ|chó|óc\s*chó)\b/gi, weight: 2 },
            { pattern: /\b(ngu|đần|khùng|điên)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('vi', { 
            patterns, 
            commonWords: ['và', 'của', 'là'], 
            culturalSensitivity: 'high' 
        });
    }

    initializeIndonesianPatterns() {
        const patterns = [
            { pattern: /\b(mati|bunuh\s*diri|pergi\s*ke\s*neraka)\b/gi, weight: 6 },
            { pattern: /\b(bangsat|anjing|kontol|memek|babi|kampret)\b/gi, weight: 2 },
            { pattern: /\b(bodoh|tolol|goblok|idiot)\b/gi, weight: 1 }
        ];
        this.toxicityDatabase.set('id', { 
            patterns, 
            commonWords: ['dan', 'yang', 'di'], 
            culturalSensitivity: 'medium' 
        });
    }

    async translateText(text, targetLang = 'en', sourceLang = null) {
        const startTime = Date.now();
        this.translationStats.totalTranslations++;
        
        try {
            const detectedLang = sourceLang || this.detectLanguage(text);
            if (detectedLang === targetLang) {
                return {
                    translatedText: text,
                    originalLanguage: this.enhancedAPI.supportedLanguages.get(detectedLang) || 'Unknown',
                    targetLanguage: this.enhancedAPI.supportedLanguages.get(targetLang) || 'Unknown',
                    confidence: 100,
                    provider: 'No translation needed',
                    processingTime: Date.now() - startTime
                };
            }

            const result = await this.enhancedAPI.translateText(text, targetLang, sourceLang);
            const responseTime = Date.now() - startTime;
            
            if (result.error) {
                this.translationStats.failedTranslations++;
            } else {
                this.translationStats.successfulTranslations++;
                
                if (result.provider) {
                    const providerName = result.provider.split(' ')[0];
                    if (!this.translationStats.providerStats[providerName]) {
                        this.translationStats.providerStats[providerName] = {
                            count: 0,
                            totalTime: 0,
                            averageTime: 0,
                            successRate: 0,
                            successes: 0
                        };
                    }
                    
                    const stats = this.translationStats.providerStats[providerName];
                    stats.count++;
                    stats.successes++;
                    stats.totalTime += responseTime;
                    stats.averageTime = Math.round(stats.totalTime / stats.count);
                    stats.successRate = Math.round((stats.successes / stats.count) * 100);
                }
            }
            
            this.translationStats.totalResponseTime += responseTime;
            this.translationStats.averageResponseTime = Math.round(
                this.translationStats.totalResponseTime / this.translationStats.totalTranslations
            );
            
            return result;

        } catch (error) {
            this.translationStats.failedTranslations++;
            return {
                translatedText: text,
                originalLanguage: 'Unknown',
                targetLanguage: this.enhancedAPI.supportedLanguages.get(targetLang) || 'Unknown',
                confidence: 0,
                error: error.message,
                processingTime: Date.now() - startTime
            };
        }
    }

    parseLanguageInput(input) {
        if (!input) return 'en';
        
        const lowerInput = input.toLowerCase().trim();
        
        if (this.enhancedAPI.supportedLanguages.has(lowerInput)) {
            return lowerInput;
        }
        
        for (const [code, name] of this.enhancedAPI.supportedLanguages.entries()) {
            if (name.toLowerCase() === lowerInput || 
                name.toLowerCase().includes(lowerInput) ||
                lowerInput.includes(name.toLowerCase().split(' ')[0])) {
                return code;
            }
        }
        
        const commonMappings = {
            'english': 'en', 'spanish': 'es', 'french': 'fr', 'german': 'de',
            'italian': 'it', 'portuguese': 'pt', 'russian': 'ru', 'japanese': 'ja',
            'chinese': 'zh', 'korean': 'ko', 'arabic': 'ar', 'hindi': 'hi',
            'dutch': 'nl', 'polish': 'pl', 'turkish': 'tr'
        };
        
        return commonMappings[lowerInput] || null;
    }

    getSupportedLanguages() {
        return Array.from(this.enhancedAPI.supportedLanguages.entries()).map(([code, name]) => ({
            code,
            name
        }));
    }

    // ENHANCED: Pokemon-aware toxicity analysis with bypass detection
    async analyzeToxicityInLanguage(text, langCode) {
        const langData = this.toxicityDatabase.get(langCode) || this.toxicityDatabase.get('en');
        if (!langData) return { toxicityLevel: 0, matches: [], elongatedWords: [], language: 'Unknown' };
        
        let toxicityLevel = 0;
        const matches = [];
        const elongatedWords = [];
        const bypassAttempts = [];
        
        // ENHANCED: Pokemon-aware bypass detection
        const lowerText = text.toLowerCase().trim();
        
        // FIRST: Check if this is legitimate Pokemon content
        if (this.isPokemonRelatedContent(text)) {
            console.log(`🎮 Pokemon content detected - skipping toxicity analysis: "${text.slice(0, 50)}..."`);
            return {
                toxicityLevel: 0,
                matches: [],
                elongatedWords: [],
                bypassAttempts: [],
                originalText: text,
                normalizedText: text.toLowerCase(),
                bypassDetected: false,
                language: this.enhancedAPI.supportedLanguages.get(langCode) || 'Unknown',
                culturalSensitivity: langData.culturalSensitivity || 'medium'
            };
        }
        
        // Step 1: Normalize bypass attempts (only for non-Pokemon content)
        const normalizedText = this.normalizeBypassAttempts(text);
        const isNormalized = normalizedText !== text.toLowerCase();
        
        // Step 2: Detect bypass attempts with Pokemon context awareness
        if (isNormalized) {
            const detectedBypasses = this.detectBypassAttempts(text, normalizedText);
            bypassAttempts.push(...detectedBypasses);
            
            // Add penalty for bypass attempts
            const bypassPenalty = detectedBypasses.reduce((sum, attempt) => sum + attempt.severity, 0);
            toxicityLevel += bypassPenalty;
            
            console.log(`🚨 BYPASS ATTEMPT DETECTED: "${text}" → "${normalizedText}" (penalty: +${bypassPenalty})`);
            console.log(`   Bypass types: ${detectedBypasses.map(b => b.type).join(', ')}`);
        }
        
        // Step 3: Test both original and normalized text against patterns
        const textsToCheck = [
            { text: text.toLowerCase(), label: 'original' },
            { text: normalizedText, label: 'normalized' }
        ];
        
        // Enhanced pattern matching with bypass detection
        for (const { text: textToCheck, label } of textsToCheck) {
            for (const patternObj of langData.patterns || []) {
                const foundMatches = textToCheck.match(patternObj.pattern);
                if (foundMatches) {
                    const weight = patternObj.weight || 1;
                    let matchScore = foundMatches.length * weight;
                    
                    // Increase penalty if match was found in normalized text (indicates bypassing)
                    if (label === 'normalized' && isNormalized) {
                        matchScore *= 1.5; // 50% penalty for bypass attempts
                        console.log(`🔍 BYPASS NORMALIZED MATCH: "${foundMatches.join(', ')}" (weight: ${weight} + bypass penalty)`);
                    } else {
                        console.log(`🔍 Direct match: "${foundMatches.join(', ')}" (weight: ${weight})`);
                    }
                    
                    toxicityLevel += matchScore;
                    matches.push(...foundMatches);
                    
                    // Track elongated words if found in normalized text
                    if (label === 'normalized' && isNormalized) {
                        for (const match of foundMatches) {
                            // Try to find the original elongated version
                            const originalPattern = this.findOriginalPattern(text, match);
                            if (originalPattern) {
                                elongatedWords.push({
                                    original: originalPattern,
                                    normalized: match,
                                    isElongated: true,
                                    bypassType: bypassAttempts.map(b => b.type).join(', ')
                                });
                            }
                        }
                    }
                }
            }
        }
        
        // FIXED: Enhanced scam detection with Pokemon awareness
        const normalizedLowerText = normalizedText.toLowerCase();
        let scamScore = 0;
        
        for (const scamPattern of this.scamPatterns) {
            // Check both original and normalized text
            if (lowerText.includes(scamPattern) || normalizedLowerText.includes(scamPattern)) {
                scamScore += 4;
                matches.push(`[SCAM: ${scamPattern}]`);
                
                if (normalizedLowerText.includes(scamPattern) && !lowerText.includes(scamPattern)) {
                    scamScore += 2; // Extra penalty for bypassed scam attempts
                    console.log(`🚨 BYPASSED SCAM PATTERN: "${scamPattern}" found after normalization`);
                }
            }
        }
        
        toxicityLevel += scamScore;
        
        // Enhanced threat patterns with bypass detection
        const severeThreats = [
            /kill\s*yourself/gi,
            /you\s*should\s*die/gi,
            /go\s*hang\s*yourself/gi,
            /end\s*your\s*life/gi,
            /commit\s*suicide/gi
        ];
        
        for (const pattern of severeThreats) {
            if (pattern.test(text) || pattern.test(normalizedText)) {
                let threatScore = 4;
                
                // Extra penalty if threat was bypassed
                if (pattern.test(normalizedText) && !pattern.test(text)) {
                    threatScore += 2;
                    console.log(`🚨 BYPASSED SEVERE THREAT detected: ${pattern}`);
                }
                
                toxicityLevel += threatScore;
                matches.push('[SEVERE_THREAT]');
            }
        }
        
        // Apply cultural sensitivity multiplier
        const sensitivity = langData.culturalSensitivity;
        if (sensitivity === 'very high') {
            toxicityLevel *= 1.3;
        } else if (sensitivity === 'high') {
            toxicityLevel *= 1.2;
        }
        
        // Additional penalty for multiple bypass techniques
        if (bypassAttempts.length > 1) {
            toxicityLevel += bypassAttempts.length;
            console.log(`🚨 MULTIPLE BYPASS TECHNIQUES detected: +${bypassAttempts.length} penalty`);
        }
        
        // Cap at 10
        const finalLevel = Math.min(10, Math.round(toxicityLevel));
        
        if (finalLevel > 0) {
            console.log(`🧠 Enhanced Toxicity Analysis Result: Level ${finalLevel}/10 for "${text}"`);
            console.log(`   Original: "${text}"`);
            console.log(`   Normalized: "${normalizedText}"`);
            console.log(`   Matches: ${matches.length} (${[...new Set(matches)].join(', ')})`);
            console.log(`   Bypass attempts: ${bypassAttempts.length}`);
            if (bypassAttempts.length > 0) {
                console.log(`   Bypass types: ${bypassAttempts.map(b => b.type).join(', ')}`);
            }
        }
        
        return {
            toxicityLevel: finalLevel,
            matches: [...new Set(matches)],
            elongatedWords: elongatedWords,
            bypassAttempts: bypassAttempts,
            originalText: text,
            normalizedText: normalizedText,
            bypassDetected: isNormalized,
            language: this.enhancedAPI.supportedLanguages.get(langCode) || 'Unknown',
            culturalSensitivity: sensitivity || 'medium'
        };
    }

    // Helper method to find original pattern in text
    findOriginalPattern(originalText, normalizedMatch) {
        const words = originalText.split(/\s+/);
        
        for (const word of words) {
            const normalizedWord = this.normalizeBypassAttempts(word);
            if (normalizedWord.includes(normalizedMatch) || normalizedMatch.includes(normalizedWord)) {
                return word;
            }
        }
        
        return normalizedMatch;
    }

    analyzeCulturalContext(text, langCode) {
        const culturalFactors = {
            formality: 'neutral',
            directness: 'medium',
            emotionalIntensity: 'normal',
            respectLevel: 'standard',
            contextualMeaning: []
        };
        
        const langData = this.toxicityDatabase.get(langCode);
        if (!langData) return culturalFactors;
        
        switch (langData.culturalSensitivity) {
            case 'very high':
                culturalFactors.formality = 'very important';
                culturalFactors.respectLevel = 'critical';
                break;
            case 'high':
                culturalFactors.formality = 'important';
                culturalFactors.respectLevel = 'high';
                break;
            default:
                culturalFactors.formality = 'moderate';
                culturalFactors.respectLevel = 'standard';
        }
        
        return culturalFactors;
    }

    getTranslationStats() {
        const successRate = this.translationStats.totalTranslations > 0 
            ? Math.round((this.translationStats.successfulTranslations / this.translationStats.totalTranslations) * 100)
            : 0;
            
        return {
            ...this.translationStats,
            successRate: successRate,
            apiStatus: this.enhancedAPI.getStatus()
        };
    }

    getTranslationStatus() {
        return this.enhancedAPI.getStatus();
    }

    async testAllAPIs() {
        console.log('🧪 Testing all translation APIs...');
        return await this.enhancedAPI.testAPIs();
    }

    // Keep existing methods but update the old normalizeElongatedText to use the new system
    normalizeElongatedText(text) {
        // Redirect to the new comprehensive system
        return this.normalizeBypassAttempts(text);
    }
}

module.exports = SynthiaMultiTranslator;
