import React, { useCallback, useMemo, useEffect, useState } from 'react';
import audioSrc from './assets/audio.mp3';
import './App.css';

const getBuffer = url => {
  const request = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
      resolve(request.response);
    };
    request.onerror = error => reject(error);
    request.send();
  });
};
let playing = false;
const defaultArr = new Array(40).fill(0);

const obj = {
  49: 256,
  50: 288,
  51: 320,
  52: 341,
  53: 384,
  54: 426,
  55: 480,
  56: 512,
  57: 542
};

function App() {
  const [arr, setArr] = useState(defaultArr);
  const audioContext = useMemo(
    () => new (window.AudioContext || window.webkitAudioContext)(),
    []
  );
  const analyser = useMemo(() => audioContext.createAnalyser(), [audioContext]);
  const audioBufferSourceNode = useMemo(
    () => audioContext.createBufferSource(),
    [audioContext]
  );
  const source = useMemo(() => audioContext.createBufferSource(), [
    audioContext
  ]);

  useEffect(() => {
    analyser.fftSize = 256;
    audioBufferSourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
  }, [analyser, audioBufferSourceNode, audioContext.destination]);

  const render = useCallback(() => {
    if (!playing) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const step = Math.round(dataArray.length / 60); //采样步长
    let arr = [];
    for (let i = 0; i < 40; i++) {
      const energy = (dataArray[step * i] / 256.0) * 50;
      arr.push(energy * 5);
    }
    setArr(arr);
    window.requestAnimationFrame(render);
  }, [analyser]);

  useEffect(() => {
    window.addEventListener('keydown', e => {
      e.stopPropagation();
      const keyCode = e.keyCode;
      console.log(keyCode);
      const frequency = obj[keyCode];
      if (!frequency) return;
      // 创建一个OscillatorNode, 它表示一个周期性波形（振荡），基本上来说创造了一个音调
      var oscillator = audioContext.createOscillator();
      // 创建一个GainNode,它可以控制音频的总音量
      var gainNode = audioContext.createGain();
      // 把音量，音调和终节点进行关联
      oscillator.connect(gainNode);
      // audioContext.destination返回AudioDestinationNode对象，表示当前audio context中所有节点的最终节点，一般表示音频渲染设备
      gainNode.connect(audioContext.destination);
      // 指定音调的类型，其他还有 square|triangle|sawtooth
      oscillator.type = 'sawtooth';
      // 设置当前播放声音的频率，也就是最终播放声音的调调
      oscillator.frequency.value = frequency;
      // 当前时间设置音量为0
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      // 0.01秒后音量为1
      gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01);
      // 音调从当前时间开始播放
      oscillator.start(audioContext.currentTime);
      // 1秒内声音慢慢降低，是个不错的停止声音的方法
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 1
      );
      // 1秒后完全停止声音
      oscillator.stop(audioContext.currentTime + 1);
    });
  }, [audioContext]);

  useEffect(() => {
    getBuffer(audioSrc).then(response => {
      audioContext.decodeAudioData(response, buffer => {
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.connect(analyser);
        // audioBufferSourceNode.buffer = buffer;
        // render();
      });
    });
  }, [analyser, audioBufferSourceNode, audioContext, render, source]);

  const play = useCallback(() => {
    playing = true;
    console.log(audioContext.state);
    source.start(0);
    render();
  }, [audioContext, render, source]);

  return (
    <div className='App'>
      <button onClick={play}>播放</button>
      <button
        onClick={() => {
          source.stop(0);
          playing = false;
        }}>
        暂停
      </button>
      <div className='graph'>
        {arr.map((item, index) => (
          <div
            className='graph-item'
            key={index}
            style={{ height: item }}></div>
        ))}
      </div>
    </div>
  );
}

export default App;
