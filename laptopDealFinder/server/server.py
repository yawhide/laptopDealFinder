from flask import Flask, render_template, request, redirect, url_for, \
  abort
from flask_pymongo import PyMongo
import sys

app = Flask(__name__)
mongo = PyMongo(app)

@app.route('/')
def hello_world():
  return 'Hello World!'

@app.route('/newegg/usa/all')
def getAllNeweggUSADocuments():
  print(mongo.db)
  print(mongo.db['laptopdealmongo_development'])
  print('neweggs:', mongo.db['laptopdealmongo_development'].neweggs)

  # docs = mongo.db.Newegg.find()
  # print(docs.count())
  return str(mongo.db['laptopdealmongo_development'].neweggs.find().count())

@app.route('/newegg/usa/groupby/gpu')
def getAllNeweggUSAGroupbyGpu():

  return

@app.route('/newegg/usa/create')
def createNewNeweggUSA():

  return

@app.route('/newegg/usa/urllist')
def getNeweggUSAUrlList():

  return

@app.route('/newegg/usa/<uuid:id>')
def getNeweggUSADocumentByID():

  return

if __name__ == '__main__':
  app.run()
