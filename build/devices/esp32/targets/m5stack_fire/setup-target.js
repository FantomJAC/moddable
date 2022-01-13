import NeoPixel from "neopixel";


import AudioOut from "pins/audioout";
import Resource from "Resource";

import Timer from "timer";
import MPU6886 from "mpu6886";
import M5Button from "m5button";

import config from "mc/config";

const state = {
	handleRotation: nop
};

export default function (done) {
	globalThis.lights = new NeoPixel({});

	globalThis.button = {
		a: new M5Button(39),
		b: new M5Button(38),
		c: new M5Button(37)
	};

	// start-up sound
	if (config.startupSound) {
		const speaker = new AudioOut({streams: 1});
		speaker.callback = function () {
			this.stop();
			this.close();
			this.done();
		};
		speaker.done = done;
		done = undefined;

		speaker.enqueue(0, AudioOut.Samples, new Resource(config.startupSound));
		speaker.enqueue(0, AudioOut.Callback, 0);
		speaker.start();
	}

	try {
		state.accelerometerGyro = new MPU6886;
		// FIXME: Need BMM150 Driver

		globalThis.accelerometer = {
			onreading: nop
		}

		globalThis.gyro = {
			onreading: nop
		}

		accelerometer.start = function(frequency){
			accelerometer.stop();
			state.accelerometerTimerID = Timer.repeat(id => {
				state.accelerometerGyro.configure({ operation: "accelerometer" });
				const sample = state.accelerometerGyro.sample();
				if (sample) {
					state.handleRotation(sample);
					accelerometer.onreading(sample);
				}
			}, frequency);
		}

		gyro.start = function(frequency){
			gyro.stop();
			state.gyroTimerID = Timer.repeat(id => {
				state.accelerometerGyro.configure({ operation: "gyroscope" });
				const sample = state.accelerometerGyro.sample();
				if (sample) {
					let {x, y, z} = sample;
					const temp = x;
					x = y * -1;
					y = temp * -1;
					z *= -1;
					gyro.onreading({ x, y, z });
				}
			}, frequency);
		}

		accelerometer.stop = function(){
			if (undefined !== state.accelerometerTimerID)
				Timer.clear(state.accelerometerTimerID);
			delete state.accelerometerTimerID;
		}

		gyro.stop = function () {
			if (undefined !== state.gyroTimerID)
				Timer.clear(state.gyroTimerID);
			delete state.gyroTimerID;
		}
	}
	catch (e) {
		trace(`Error initializing: ${e}\n`);
	}

	if (config.autorotate && globalThis.Application && globalThis.accelerometer) {
		state.handleRotation = function (reading) {
			if (globalThis.application === undefined) return;

			if (Math.abs(reading.y) > Math.abs(reading.x)) {
				if (reading.y < -0.7 && application.rotation != 90) {
					application.rotation = 90;
				} else if (reading.y > 0.7 && application.rotation != 270) {
					application.rotation = 270;
				}
			} else {
				if (reading.x < -0.7 && application.rotation != 0) {
					application.rotation = 0;
				} else if (reading.x > 0.7 && application.rotation != 180) {
					application.rotation = 180;
				}
			}
		}
		accelerometer.start(300);
	}

	done?.();
}

function nop() {
}

