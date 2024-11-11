const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws'); // 웹소켓 서버를 추가
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3389;
const BASE_PATH = process.env.BASE_PATH || '/api/tts';

app.use(cors());
app.use(express.json());

// HTTP 방식 TTS 엔드포인트를 유지하려면 여기에 그대로 둡니다.
app.post('/api/tts', async (req, res) => {
    try {
        const { input } = req.body;
        
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: input,
                voice: 'nova',
                response_format: 'opus',
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI API Error:', errorText);
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const audioBuffer = await response.arrayBuffer();
        res.set('Content-Type', 'audio/opus');
        res.send(Buffer.from(audioBuffer));
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Express 서버를 시작
const server = app.listen(port, () => {
    console.log(`Local Edge Function server running on port ${port}`);
    console.log(`TTS endpoint available at ${BASE_PATH}`);
});

// 웹소켓 서버 추가
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log("WebSocket connection opened.");

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            const { text } = data; // 클라이언트로부터 받은 텍스트
            
            // TTS API 요청
            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    input: text,
                    voice: 'nova',
                    response_format: 'opus',
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('OpenAI API Error:', errorText);
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const audioBuffer = await response.arrayBuffer();
            ws.send(audioBuffer); // 오디오 데이터를 클라이언트로 전송
            
        } catch (error) {
            console.error('Error processing TTS request:', error);
            ws.send(JSON.stringify({ error: error.message })); // 에러 발생 시 클라이언트에 전송
        }
    });

    ws.on('close', () => {
        console.log("WebSocket connection closed.");
    });
});
