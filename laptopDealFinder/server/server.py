from flask import Flask, render_template, request, redirect, url_for, \
  abort, send_from_directory, jsonify, Response
from flask_pymongo import PyMongo
from copy import deepcopy
from werkzeug.local import LocalProxy

import sys, json, re
import helper
import pydash as _

app = Flask(__name__)
app.config['MONGO_DBNAME'] = 'laptopdealmongo-development'
mongo = PyMongo(app)

# Newegg = mongo.db.laptopdealmongo_development.neweggs

neweggUSAUrlListFilePath = '../cron/neweggUSAGamingLaptopUris.txt'

@app.route('/')
def hello_world():
  return 'Hello World!'

@app.route('/newegg/usa/all')
def getAllNeweggUSADocuments():
  print(mongo.db)
  print(mongo.db['laptopdealmongo_development'])
  print('neweggs:', mongo.db['laptopdealmongo_development'].neweggs)

  print(mongo.db['laptopdealmongo_development'].neweggs.find().count())
  docs = mongo.db.neweggs.find()
  print(docs.count())

  return

@app.route('/newegg/usa/groupby/gpu')
def getAllNeweggUSAGroupbyGpu():
  laptops = mongo.db.neweggs.find()
  laptops = helper.filterBySpecList(laptops)
  graphicCardGroups = helper.groupByGPU(laptops)
  print(graphicCardGroups)
  for gpu in graphicCardGroups:
    graphicCardGroups[gpu].sort(key=lambda doc: re.sub(r'\D', '', doc.getPrice) )
   # Object.keys(graphicsCardGroup).forEach(key=>{
   #    graphicsCardGroup[key].sort((a,b) => {
   #      let left = a.getPrice || '1000000';
   #      let right = b.getPrice || '1000000';
   #      left = left.replace(/\D/g,'');
   #      right = right.replace(/\D/g,'');
   #      return parseInt(left) - parseInt(right);
   #    });
   #  });
  print(graphicCardGroups)
  return 'ok'

@app.route('/newegg/usa/create', methods=['POST'])
def createNewNeweggUSA():
  data = request.get_json()
  if not data.get('neweggID'):
    abort(400)
    return
  # print(data, data.get('neweggID'))
  price_info = data.get('priceInfo')
  if price_info is not None:
    data['priceHistory'] = [deepcopy(price_info)]
    data.pop('priceInfo', None)
  else:
    data['priceHistory'] = []
  # print('data after', data)
  product = mongo.db.neweggs.find_one({ 'neweggID': data.get('neweggID') })
  # print('product', product)
  if product is None:
    mongo.db.neweggs.insert_one(data)
  else:
    # product['images'] = data['images']
    # product.get('priceHistory').append(price_info)
    mongo.db.neweggs.update_one(
      { '_id': product.get('_id') },
      { '$set': { 'images': data.get('images') }, '$push': { 'priceHistory': price_info } }
    )
  # print (product)
  return 'ok'

@app.route('/newegg/usa/urllist')
def getNeweggUSAUrlList():
  url_list_file = open(neweggUSAUrlListFilePath)
  url_list = url_list_file.read().strip();
  # print(url_list.split('\n'))
  urls = set(url_list.split('\n'))
  docs = []#mongo.db.neweggs.find()
  filteredDocs = set([x.get('url') for x in docs if x.get('url')])
  print('total:', len(urls), #'db:', docs.count(),
    'filtered from db:', len(filteredDocs))

  return Response(json.dumps(list(urls - filteredDocs)), mimetype='application/json')

@app.route('/newegg/usa/<uuid:id>')
def getNeweggUSADocumentByID():

  return

if __name__ == '__main__':
  app.run()

