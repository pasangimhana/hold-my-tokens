import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setChromiumOpenGlRenderer('angle');
Config.setConcurrency(5);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(16);
