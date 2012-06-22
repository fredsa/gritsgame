'''Copyright 2011 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
#limitations under the License.'''
from google.appengine.api import backends

from google.appengine.ext import ndb

import json
import logging
import os

from client import shared


class Config(ndb.Model):
  client_id = ndb.StringProperty(indexed=False)
  client_secret = ndb.StringProperty(indexed=False)


class User(ndb.Model):
  displayName = ndb.StringProperty(indexed=False)
  createDate = ndb.DateTimeProperty(indexed=False)
  credits = ndb.IntegerProperty(indexed=False)
  numWins = ndb.IntegerProperty(indexed=False)
  numLoss = ndb.IntegerProperty(indexed=False)
  virtualItems = ndb.StringProperty(repeated=True, indexed=False)


def getConfig(origin):
  return Config.get_by_id(str(origin))


def setConfig(origin, client_id, client_secret):
  config = Config(id=str(origin), client_id=client_id, client_secret=client_secret)
  config.put()


def getUser(userID):
  return User.get_by_id(str(userID))


def newUser(userID, displayName):
  usr = User(id=str(userID))
  usr.displayName = displayName
  usr.credits = 1000
  usr.numWins = 3
  usr.numLosses = 5
  usr.put()
  return usr


#NOTE what are we doing here, really?
#the goal is to have virtual currency, but also allow for purchacing item combos
#called when client asks to unlock an item with credits
def unlockItemForUser(userID, itemID):
  usr = getUser(userID)
  if not usr:
    return None

  vi = shared.getVirtualItem(itemID)
  if not vi:
    return None

  #Do this the hacky way and jusr push it to the end.
  usr.virtualItems.append(itemID)
  usr.credits -= vi.priceInCredits
  usr.push()

  return True


#called during a postback call from the IAP server
def purchaseItemForUser(userID, itemID):
  usr = getUser(userID)
  if not usr:
    return None

  vi = shared.getVirtualItem(itemID)
  if not vi:
    return None

  if vi.itemType == "credits":
    usr.credits += vi.itemData0
    return True

  return None

def userAttemptToBuy(userID, itemID):
  assert userID
  assert itemID

  result = ""
  usr = getUser(userID)
  if not usr:
    return {'result': False, 'message': 'User not found'}

  vi = shared.getVirtualItem(itemID)
  if not vi:
    return {'result': False, 'message': 'Item not found; please check with the admin'}

  #if the user has enough credits for the item, unlock the item
  if usr.credits >= vi['priceInCredits']:
    usr.virtualItems.append(itemID)
    usr.credits -= vi['priceInCredits']
    usr.put()
    return {'result': True, 'itemID': itemID, 'userCredits': usr.credits}

  return  {'result': False, 'itemID': itemID, 'userCredits': usr.credits}

