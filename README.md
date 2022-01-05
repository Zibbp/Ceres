<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a>
    <img src=".github/ceres_logo_full.png" alt="Logo" width="80" height="80">
  </a>

  <h2 align="center">Ceres</h2>

  <p align="center">
    Archive Twitch VODs with a rendered chat.
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About

![Demo](.github/landing_demo.jpg)

Ceres is a backend and frontend solution for downloading and viewing Twitch VODs. Ceres uses [Lay295's TwitchDownloader](https://github.com/lay295/TwitchDownloader) to download the video and render the chat. Ceres downloads and saves everything locally meaning the data is yours to keep and no Twitch API calls are made while watching the VOD.

Downloaded data is saved in a user friendly way allowing you to keep and browse your archived vods without needing Ceres. Below is the folder structure for channel and VOD data.

```
/mnt/vods/
├── asmongold/
│   ├── 1042411777/
│   │   ├── 1042411777_video.mp4
│   │   ├── 1042411777_chat.mp4
│   │   ├── 1042411777_chat.json
│   │   ├── 1042411777_info.json
│   │   ├── 1042411777_thumbnail.jpg
│   │   └── 1042411777_web_thumbnail.jpg
│   ├── 1043421343/
│   │   └── ...
│   ├── 1046683902/
│   │   └── ...
│   ├── asmongold_profile.png
│   └── asmongold_offline_banner.png
├── mizkif/
│   ├── mizkif_profile.png
│   └── mizkif_offline_banner.png
├── esfandtv/
│   ├── esfandtv_profile.png
│   └── esfandtv_offline_banner.png
└── staysafetv/
    ├── staysafetv_profile.png
    └── staysafetv_offline_banner.png
```
