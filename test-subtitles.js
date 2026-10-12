import {
  formatTimeSRT,
  formatTimeVTT,
  generateSRT,
  generateVTT,
  getExportFilename,
} from './src/utils/subtitles.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('--- Testing Subtitle Timestamp Formatting ---');

// Test 1: SRT timestamp format HH:MM:SS,mmm
const srtTime = formatTimeSRT(65.432);
assert(srtTime === '00:01:05,432', `SRT 65.432s formatted as "00:01:05,432" (got: ${srtTime})`);

const srtHour = formatTimeSRT(3661.123);
assert(srtHour === '01:01:01,123', `SRT 3661.123s formatted as "01:01:01,123" (got: ${srtHour})`);

// Test 2: WebVTT timestamp format HH:MM:SS.mmm
const vttTime = formatTimeVTT(65.432);
assert(vttTime === '00:01:05.432', `VTT 65.432s formatted as "00:01:05.432" (got: ${vttTime})`);

const vttHour = formatTimeVTT(3661.123);
assert(vttHour === '01:01:01.123', `VTT 3661.123s formatted as "01:01:01.123" (got: ${vttHour})`);

console.log('\n--- Testing SRT Generation with Sample Transcript Data ---');

const sampleSegments = [
  {
    id: 'seg_1',
    index: 1,
    startTime: 1.25,
    endTime: 4.8,
    text: 'Welcome back to the stream everyone.',
  },
  {
    id: 'seg_2',
    index: 2,
    startTime: 5.3,
    endTime: 9.15,
    text: 'Today we are building CaptionPilot live for creators.',
  },
  {
    id: 'seg_3',
    index: 3,
    startTime: 10.0,
    endTime: 14.45,
    text: 'This is an edited segment with custom developer corrections.',
  },
];

const generatedSRT = generateSRT(sampleSegments);
console.log('Generated SRT Output:\n' + generatedSRT);

assert(
  generatedSRT.includes('1\n00:00:01,250 --> 00:00:04,800\nWelcome back to the stream everyone.'),
  'SRT contains segment 1 with valid HH:MM:SS,mmm timestamp'
);

assert(
  generatedSRT.includes('2\n00:00:05,300 --> 00:00:09,150\nToday we are building CaptionPilot live for creators.'),
  'SRT contains segment 2'
);

assert(
  generatedSRT.includes('3\n00:00:10,000 --> 00:00:14,450\nThis is an edited segment with custom developer corrections.'),
  'SRT contains edited segment 3 text'
);

// Verify SRT regex structure
const srtRegex = /^\d+\r?\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\r?\n.+/m;
assert(srtRegex.test(generatedSRT), 'SRT matches SubRip formal specification pattern');

console.log('\n--- Testing WebVTT Generation with Sample Transcript Data ---');

const generatedVTT = generateVTT(sampleSegments);
console.log('Generated WebVTT Output:\n' + generatedVTT);

assert(generatedVTT.startsWith('WEBVTT\n\n'), 'WebVTT starts with required "WEBVTT\\n\\n" header');

assert(
  generatedVTT.includes('1\n00:00:01.250 --> 00:00:04.800\nWelcome back to the stream everyone.'),
  'WebVTT contains segment 1 with valid HH:MM:SS.mmm timestamp'
);

assert(
  generatedVTT.includes('3\n00:00:10.000 --> 00:00:14.450\nThis is an edited segment with custom developer corrections.'),
  'WebVTT preserves edited text'
);

console.log('\n--- Testing Filename Generation ---');
const filename = getExportFilename('My YouTube Live #42', 'srt');
assert(
  filename.startsWith('my_youtube_live_42_') && filename.endsWith('.srt'),
  `Sanitized export filename: "${filename}"`
);

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed.`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
