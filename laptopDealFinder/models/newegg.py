import mongoengine as me

class Newegg():
  price_history = me.ListField()
  newegg_ID = me.StringField()
  url = me.StringField()
  images = me.ListField()
