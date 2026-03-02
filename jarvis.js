const logEl = document.getElementById('log');
const commandInput = document.getElementById('manual-command');

const startBtn = document.getElementById('start-listen');
const stopBtn = document.getElementById('stop-listen');
const runBtn = document.getElementById('run-command');
const clearBtn = document.getElementById('clear-log');
const speakBtn = document.getElementById('speak-now');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = true;

  recognition.addEventListener('result', (event) => {
    const lastResult = event.results[event.results.length - 1];
    const transcript = lastResult[0].transcript.trim();
    appendLog(`You: ${transcript}`);
    runCommand(transcript);
  });

  recognition.addEventListener('error', (event) => {
    appendLog(`Jarvis: Listening error - ${event.error}`);
  });
}

function appendLog(text) {
  const line = document.createElement('p');
  line.textContent = text;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function openUrl(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function runCommand(raw) {
  const command = raw.toLowerCase().trim();

  if (!command) return;

  if (command.startsWith('say ')) {
    const words = raw.slice(4).trim();
    speak(words || 'Ready.');
    appendLog(`Jarvis: Speaking "${words || 'Ready.'}"`);
    return;
  }

  if (command.startsWith('type ')) {
    const words = raw.slice(5).trim();
    commandInput.value = words;
    appendLog(`Jarvis: Typed into input: ${words}`);
    return;
  }

  if (command.includes('open instagram')) {
    openUrl('https://www.instagram.com/');
    speak('Opening Instagram');
    appendLog('Jarvis: Opening Instagram.');
    return;
  }

  if (command.startsWith('message ')) {
    const parts = raw.slice(8).trim();
    const [target, ...messageParts] = parts.split(' ');
    const message = messageParts.join(' ').trim();

    if (!target) {
      appendLog('Jarvis: Use format "message @username your text".');
      return;
    }

    const username = target.replace('@', '');
    if (message) {
      openUrl(`https://www.instagram.com/direct/new/?username=${encodeURIComponent(username)}`);
      appendLog(`Jarvis: Opening Instagram DM compose for @${username}. Copy message: ${message}`);
      speak(`Opening message screen for ${username}`);
    } else {
      openUrl(`https://www.instagram.com/${encodeURIComponent(username)}/`);
      appendLog(`Jarvis: Opening @${username} profile.`);
    }
    return;
  }

  if (command.startsWith('play video ')) {
    const query = raw.slice(11).trim();
    openUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(query || 'trending')}`);
    appendLog(`Jarvis: Opening video results for "${query || 'trending'}".`);
    speak('Opening videos');
    return;
  }

  if (command.includes('open youtube')) {
    openUrl('https://www.youtube.com/');
    appendLog('Jarvis: Opening YouTube.');
    return;
  }

  if (command.includes('help')) {
    appendLog('Jarvis: Try commands: open instagram, message @user hi, play video lo-fi, type hello, say hello.');
    return;
  }

  appendLog('Jarvis: Command not recognized. Say "help" for examples.');
}

startBtn.addEventListener('click', () => {
  if (!recognition) {
    appendLog('Jarvis: Speech recognition is not supported on this browser.');
    return;
  }
  recognition.start();
  appendLog('Jarvis: Listening...');
});

stopBtn.addEventListener('click', () => {
  if (recognition) recognition.stop();
  appendLog('Jarvis: Stopped listening.');
});

runBtn.addEventListener('click', () => {
  const value = commandInput.value.trim();
  appendLog(`You: ${value}`);
  runCommand(value);
});

commandInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') runBtn.click();
});

clearBtn.addEventListener('click', () => {
  logEl.innerHTML = '';
});

speakBtn.addEventListener('click', () => {
  speak('Hello boss. Jarvis online and ready.');
  appendLog('Jarvis: Hello boss. Jarvis online and ready.');
});

appendLog('Jarvis: Ready. Say "help" to see commands.');
