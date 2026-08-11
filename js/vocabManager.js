/**
 * Vocabulary Lookup & Custom Wordbook Manager
 */

import { BUILTIN_DICTIONARY } from './textData.js';
import { storage } from './storage.js';
import { ttsEngine } from './ttsEngine.js';

export const vocabManager = {
  /**
   * Compound word & Novel term inference helper
   */
  inferCompoundWordOrNovelTerm(cleanWord, sentenceContext = '') {
    // Novel term glossary
    const NOVEL_GLOSSARY = {
      giver: { meaning: '기억 전달자 (소설의 주인공과 공동체의 전임 기억 보유자)', phonetics: '/ˈɡɪvə(r)/' },
      receiver: { meaning: '기억 수령자 (소설 내 역사와 경험을 홀로 품는 핵심 지도자)', phonetics: '/rɪˈsiːvə(r)/' },
      nurturer: { meaning: '양육자 (갓난아기를 돌보고 케어하는 직업)', phonetics: '/ˈnɜːtʃərər/' },
      release: { meaning: '임무 해제 / 추방 (소설 속 마을의 안락사 및 사회적 제거 의미)', phonetics: '/rɪˈliːs/' },
      stirrings: { meaning: '성장기 감정의 동요 (소설 속 사회에서 약물로 억제하는 본능적 감정)', phonetics: '/ˈstɜːrɪŋz/' },
      assignment: { meaning: '일생 직무 부여 (12세 의식에서 각자에게 지정되는 직업)', phonetics: '/əˈsaɪnmənt/' },
      ceremony: { meaning: '연례 의식 (아이들에게 나이별 소지품과 사회적 역할을 선사하는 연례 행사)', phonetics: '/ˈserəməni/' },
      newchild: { meaning: '신생아 (육아 센터에서 관리받는 갓 태어난 아기)', phonetics: '/ˈnjuːtʃaɪld/' },
      nightcrew: { meaning: '야간 근무조 (야간에 마을을 관리하고 보육을 맡는 당직자)', phonetics: '/ˈnaɪtkruː/' }
    };

    if (NOVEL_GLOSSARY[cleanWord]) {
      return NOVEL_GLOSSARY[cleanWord];
    }

    // Known compound word components
    const COMPOUNDS = [
      { word: 'riverbank', parts: ['river(강)', 'bank(둑, 기슭)'], meaning: '강둑, 강변 (강가 언덕 및 기슭)', phonetics: '/ˈrɪvəbæŋk/' },
      { word: 'aircraft', parts: ['air(공기)', 'craft(선박/비행체)'], meaning: '항공기, 비행기', phonetics: '/ˈeəkrɑːft/' },
      { word: 'loudspeaker', parts: ['loud(소리가 큰)', 'speaker(확성기)'], meaning: '확성기, 앰프 스피커', phonetics: '/ˌlaʊdˈspiːkə(r)/' },
      { word: 'unidentified', parts: ['un(미-)', 'identified(확인된)'], meaning: '정체불명의, 신원 미상의', phonetics: '/ˌʌnaɪˈdentɪfaɪd/' },
      { word: 'unloading', parts: ['un(해제)', 'loading(적재)'], meaning: '하역, 화물 내리기', phonetics: '/ʌnˈləʊdɪŋ/' },
      { word: 'sunlight', parts: ['sun(태양)', 'light(빛)'], meaning: '햇빛, 햇살', phonetics: '/ˈsʌnlaɪt/' },
      { word: 'airfield', parts: ['air(항공)', 'field(들판/장)'], meaning: '비행장, 활주로', phonetics: '/ˈeəfiːld/' },
      { word: 'riverbank', parts: ['river(강)', 'bank(둑)'], meaning: '강둑, 강변', phonetics: '/ˈrɪvəbæŋk/' }
    ];

    const match = COMPOUNDS.find(c => c.word === cleanWord);
    if (match) {
      return { meaning: match.meaning, phonetics: match.phonetics };
    }

    return null;
  },

  /**
   * Search word definition from built-in dict, saved vocab, or fallback API
   */
  async lookupWord(wordStr, sentenceContext = '') {
    const cleanWord = wordStr.toLowerCase().trim().replace(/[^a-z'-]/g, '');
    if (!cleanWord) return null;

    // 1. Check saved vocabulary first (Auto repair if saved with generic placeholder)
    const savedList = storage.getSavedVocab();
    const savedMatch = savedList.find(item => item.word.toLowerCase() === cleanWord);
    if (savedMatch && savedMatch.meaning && !savedMatch.meaning.includes('편집') && !savedMatch.meaning.includes('추가해보세요')) {
      return { ...savedMatch, isSaved: true };
    }

    // 2. Check built-in dictionary
    if (BUILTIN_DICTIONARY[cleanWord]) {
      const entry = {
        ...BUILTIN_DICTIONARY[cleanWord],
        isSaved: !!savedMatch,
        example: sentenceContext || BUILTIN_DICTIONARY[cleanWord].example
      };
      if (savedMatch) storage.saveWord(entry);
      return entry;
    }

    // 3. Check Novel Term Glossary & Compound Word Inferrer
    const inferred = this.inferCompoundWordOrNovelTerm(cleanWord, sentenceContext);
    if (inferred) {
      const entry = {
        word: cleanWord,
        phonetics: inferred.phonetics || '/---/',
        meaning: inferred.meaning,
        definition: inferred.meaning,
        example: sentenceContext,
        isSaved: !!savedMatch
      };
      if (savedMatch) storage.saveWord(entry);
      return entry;
    }

    // 4. Smart Fallback: Free Dictionary API & MyMemory Translation API
    let koreanMeaning = '';
    let phonetic = '/---/';
    let definition = '';
    let example = sentenceContext;

    try {
      const [dictRes, transRes] = await Promise.allSettled([
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`),
        fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|ko`)
      ]);

      if (dictRes.status === 'fulfilled' && dictRes.value.ok) {
        const dictData = await dictRes.value.json();
        if (dictData && dictData[0]) {
          const entry = dictData[0];
          phonetic = entry.phonetic || (entry.phonetics && entry.phonetics.find(p => p.text) ? entry.phonetics.find(p => p.text).text : '/---/');
          const meaningObj = entry.meanings && entry.meanings[0];
          definition = meaningObj && meaningObj.definitions[0] ? meaningObj.definitions[0].definition : '';
          if (meaningObj && meaningObj.definitions[0] && meaningObj.definitions[0].example) {
            example = meaningObj.definitions[0].example;
          }
        }
      }

      if (transRes.status === 'fulfilled' && transRes.value.ok) {
        const transData = await transRes.value.json();
        if (transData && transData.responseData && transData.responseData.translatedText) {
          const rawTrans = transData.responseData.translatedText;
          // Filter out API error limits if any
          if (!rawTrans.includes('MYMEMORY WARNING') && !rawTrans.includes('QUERY LENGTH')) {
            koreanMeaning = rawTrans;
          }
        }
      }
    } catch (e) {
      console.warn('Online dictionary/translation fetch error:', e);
    }

    const finalMeaning = koreanMeaning || definition || `${cleanWord} (문맥 의미)`;
    const resultEntry = {
      word: cleanWord,
      phonetics: phonetic || '/---/',
      meaning: finalMeaning,
      definition: definition || finalMeaning,
      example: example || sentenceContext,
      isSaved: !!savedMatch
    };

    if (savedMatch) storage.saveWord(resultEntry);
    return resultEntry;
  },

  saveWordToVocab(wordData) {
    const list = storage.saveWord(wordData);
    return list;
  },

  removeWordFromVocab(wordStr) {
    const list = storage.removeWord(wordStr);
    return list;
  },

  updateWordStatus(wordStr, status) {
    return storage.updateWordStatus(wordStr, status);
  },

  playPronunciation(wordStr) {
    ttsEngine.speakWord(wordStr);
  }
};
