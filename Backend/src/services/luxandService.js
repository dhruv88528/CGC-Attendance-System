const axios = require('axios');
const FormData = require('form-data');

class LuxandService {
    constructor() {
        this.token = process.env.LUXAND_API_TOKEN;
        this.baseUrl = 'https://api.luxand.cloud';
    }

    getHeaders(isMultipart = false) {
        const headers = {
            'token': this.token
        };
        if (isMultipart) {
            // Axios with FormData automatically sets Content-Type
        } else {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    }

    // Convert Base64 to Buffer
    getImageBuffer(base64String) {
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            return Buffer.from(matches[2], 'base64');
        }
        return Buffer.from(base64String, 'base64');
    }

    /**
     * Register a new person (Subject) and add a face
     * @param {String} name - Name of the person (Student ID)
     * @param {String} imageBase64 - Face image
     */
    async registerPerson(name, imageBase64) {
        if (!this.token) throw new Error('Luxand API Token not configured');

        try {
            // 1. Create Subject
            const createRes = await axios.post(`${this.baseUrl}/subject`,
                { name: name },
                { headers: this.getHeaders() }
            );

            const personId = createRes.data.id;

            // 2. Add Face to Subject
            const form = new FormData();
            form.append('photo', this.getImageBuffer(imageBase64), { filename: 'face.jpg' });

            const addFaceRes = await axios.post(`${this.baseUrl}/subject/${personId}`, form, {
                headers: {
                    ...this.getHeaders(true),
                    ...form.getHeaders()
                }
            });

            return {
                success: true,
                personId: personId,
                faceId: addFaceRes.data.id,
                confidence: 1.0 // Implicitly high for registration
            };
        } catch (error) {
            console.error('Luxand Registration Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Luxand Registration Failed');
        }
    }

    /**
     * Recognize a face in an image
     * @param {String} imageBase64 
     */
    async recognize(imageBase64) {
        if (!this.token) throw new Error('Luxand API Token not configured');

        try {
            const form = new FormData();
            form.append('photo', this.getImageBuffer(imageBase64), { filename: 'query.jpg' });

            const response = await axios.post(`${this.baseUrl}/photo/search`, form, {
                headers: {
                    ...this.getHeaders(true),
                    ...form.getHeaders()
                }
            });

            // Response is array of matches
            // [{ id, name, probability, rectangle: { top, left, bottom, right } }]
            return response.data.map(match => ({
                student_id: match.name,
                confidence: match.probability,
                bbox: [
                    match.rectangle.left,
                    match.rectangle.top,
                    match.rectangle.right - match.rectangle.left,
                    match.rectangle.bottom - match.rectangle.top
                ]
            }));

        } catch (error) {
            console.error('Luxand Recognition Error:', error.response?.data || error.message);
            // Return empty array on no match or error (to handle gracefully)
            return [];
        }
    }

    /**
     * List all subjects (Optional, for debugging)
     */
    async listSubjects() {
        if (!this.token) throw new Error('Luxand API Token not configured');
        const response = await axios.get(`${this.baseUrl}/subject`, { headers: this.getHeaders() });
        return response.data;
    }

    /**
     * Verify a face against a specific person ID
     * @param {String} personId - Luxand Person ID
     * @param {String} imageBase64 
     */
    async verify(personId, imageBase64) {
        if (!this.token) throw new Error('Luxand API Token not configured');

        try {
            const form = new FormData();
            form.append('photo', this.getImageBuffer(imageBase64), { filename: 'verify.jpg' });

            const response = await axios.post(`${this.baseUrl}/photo/verify/${personId}`, form, {
                headers: {
                    ...this.getHeaders(true),
                    ...form.getHeaders()
                }
            });

            // Response: { status: "success", probability: 0.98, ... }
            const probability = response.data.probability;
            return {
                success: true,
                isMatch: probability > 0.85,
                confidence: probability
            };
        } catch (error) {
            console.error('Luxand Verification Error:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new LuxandService();