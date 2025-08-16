from flask import Flask, request, jsonify
import pickle
import re
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)

# Load the trained models
with open('email_classifier.pkl', 'rb') as f:
    rf_classifier = pickle.load(f)
with open('tfidf_vectorizer.pkl', 'rb') as f:
    tfidf = pickle.load(f)

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = ' '.join(text.split())
    return text
# Update the predict_email function in app.py
@app.route('/predict', methods=['POST'])
def predict_email():
    try:
        data = request.get_json()
        email_text = data.get('email_text', '')
        
        if not email_text:
            return jsonify({'error': 'No email text provided'}), 400
            
        # Preprocess and predict
        processed_text = preprocess_text(email_text)
        text_tfidf = tfidf.transform([processed_text])
        prediction = rf_classifier.predict(text_tfidf)
        probability = rf_classifier.predict_proba(text_tfidf)
        
        result = {
            'prediction': 'Safe Email' if prediction[0] == 0 else 'Phishing Email',
            'confidence': float(max(probability[0]) * 100),
            'processed_text': processed_text,  # Add processed text to response
            'original_length': len(email_text),
            'processed_length': len(processed_text)
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True, port=5000)