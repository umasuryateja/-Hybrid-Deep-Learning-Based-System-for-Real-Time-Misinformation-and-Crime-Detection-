import os
import numpy as np
import tensorflow as tf
import pickle
from flask import Flask, request, jsonify, render_template
from PIL import Image
from werkzeug.utils import secure_filename
import re
import cv2
import torch
from ultralytics import YOLO
import gradio as gr
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

# Initialize Flask app
app = Flask(__name__)

# Load the trained YOLOv8 model for weapon detection
yolo_model_path = r"CNN_yolo.pt"
yolo_model = YOLO(yolo_model_path)

# Load the TF-IDF vectorizer for fake news detection
vectorizer_path = r"tfidf_tokenizer.pkl"
with open(vectorizer_path, "rb") as f:
    tfidf_vectorizer = pickle.load(f)

# Load the trained fake news detection model (LSTM)
fake_news_model_path = r"Misinformation_bert.h5"
fake_news_model = tf.keras.models.load_model(fake_news_model_path)

# Define upload folder
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Function to process image for YOLO and check for weapons
def predict_weapon(image_path):
    image = cv2.imread(image_path)
    results = yolo_model(image)  # Run YOLO detection
    
    # Check if any weapons are detected
    if len(results[0].boxes) > 0:  # If any bounding boxes are detected
        return "Unsafe"  # Weapon detected
    else:
        return "Safe"  # No weapon detected

# Routes for pages
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/chatbot')
def chatbot():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/details')
def details():
    return render_template('details.html')

# API routes
@app.route("/predict-image", methods=["POST"])
def predict_image():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    # Process image with YOLO
    result = predict_weapon(file_path)

    return jsonify({"filename": filename, "prediction": result})

# Text preprocessing function
maxlen = 150

def preprocess_text(text):
    text = re.sub(r'\s+', ' ', text, flags=re.I)
    text = re.sub(r'\W', ' ', text)
    text = re.sub(r'\s+[a-zA-Z]\s+', ' ', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = text.lower()
    words = word_tokenize(text)
    lemmatizer = WordNetLemmatizer()
    words = [lemmatizer.lemmatize(word) for word in words]
    stop_words = set(stopwords.words("english"))
    words = [word for word in words if word not in stop_words and len(word) > 3]
    return ' '.join(words)

@app.route('/predict-text', methods=['POST'])
def predict_text():
    data = request.get_json(force=True)
    text = data.get("message", None)
    if not text:
        return jsonify({"error": "No text provided"}), 400

    # Process text and prepare for model
    processed_text = preprocess_text(text)
    sequence = tfidf_vectorizer.texts_to_sequences([processed_text])
    padded_sequence = pad_sequences(sequence, maxlen=maxlen)

    # Predict using LSTM model
    prediction = fake_news_model.predict(padded_sequence)
    label = "MisInformation" if prediction[0][0] > 0.5 else "Real News"

    return jsonify({"prediction": label, "confidence": float(np.max(prediction))}), 200

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)
