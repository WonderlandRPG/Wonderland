"use strict";
(() => {
    const DEFAULT_VOLUME = 0.25;
    const STORAGE_KEYS = {enabled:"wonderlandMusicEnabled",time:"wonderlandMusicTime",volume:"wonderlandMusicVolume"};
    function clampVolume(value){const numeric=Number(value);return Number.isFinite(numeric)?Math.min(Math.max(numeric,0),1):DEFAULT_VOLUME}
    function syncAudioState(){
        const music=document.getElementById("bgMusic");if(!music)return;
        const storedVolume=localStorage.getItem(STORAGE_KEYS.volume);const savedVolume=storedVolume===null?DEFAULT_VOLUME:clampVolume(storedVolume);
        if(storedVolume===null)localStorage.setItem(STORAGE_KEYS.volume,String(DEFAULT_VOLUME));music.volume=savedVolume;music.muted=savedVolume===0;
        const savedTime=Number(localStorage.getItem(STORAGE_KEYS.time));
        const restoreTime=()=>{if(Number.isFinite(savedTime)&&savedTime>0&&Number.isFinite(music.duration)&&savedTime<music.duration)music.currentTime=savedTime};
        const saveState=()=>{if(Number.isFinite(music.currentTime)&&music.currentTime>=0)localStorage.setItem(STORAGE_KEYS.time,String(music.currentTime));localStorage.setItem(STORAGE_KEYS.volume,String(music.volume))};
        music.addEventListener("loadedmetadata",restoreTime,{once:true});if(music.readyState>=1)restoreTime();
        music.addEventListener("volumechange",()=>localStorage.setItem(STORAGE_KEYS.volume,String(music.volume)));music.addEventListener("timeupdate",saveState);window.addEventListener("pagehide",saveState);window.addEventListener("beforeunload",saveState);
        window.addEventListener("storage",event=>{if(event.key!==STORAGE_KEYS.volume)return;const next=event.newValue===null?DEFAULT_VOLUME:clampVolume(event.newValue);music.volume=next;music.muted=next===0});
        const originalPlay=music.play.bind(music);music.play=(...args)=>{const stored=localStorage.getItem(STORAGE_KEYS.volume);const current=stored===null?DEFAULT_VOLUME:clampVolume(stored);music.volume=current;music.muted=current===0;return originalPlay(...args)};
    }
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",syncAudioState,{once:true});else syncAudioState();
})();
