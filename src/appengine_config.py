import logging

# Change default log level to debug in dev_appserver to match production
logging.getLogger().setLevel(logging.DEBUG)

# but leave the default for App Engine APIs
logging.getLogger('google.appengine').setLevel(logging.INFO)
