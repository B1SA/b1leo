# SMB Marketplace [ARCHIVED]
[![SAP](https://i.imgur.com/S8BS6PX.png)](https://sap.com)

*A SMB Shop Assistant to integrate SAP Business One, SAP Business ByDesign and SAP Leonardo on SAP Cloud Platform. [See how is works here](https://www.youtube.com/watch?v=M3puey2iw30) and get more details [in this blog](https://blogs.sap.com/2018/05/24/digital-transformation-for-smbs-the-intelligent-enterprise)*

## Table of Contents
* **[Prerequisites](#Prerequisites)**
* **[Installation](#installation)**
* **[Digital Core preparation](#step-1---digital-core-preparation)**
* **[App Config and Deployment](#step-2----app-configuration-and-cloud-deployment)**
* **[License](#license)**

## Prerequisites
* A free trial account on [SAP Cloud Platform]((https://cloudplatform.sap.com)) with Cloud Foundry Trial initialized;
* The [Cloud Foundry Command Line Interface (CLI)](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html) on your machine;

## Installation
> First clone or download this repository. Then:


## STEP #1 - Digital Core preparation
### Setup the SAP ByD OData API services and Business Analytics
In order for this application to consume SAP ByD data, it needs to be exposed via webservices. Some data (such as Items) can be accessed via an standard OData API. Others (like inventory) are available via a reporting API called Business Analytics:
* Import the all the available [models](https://github.com/B1SA/smbmkt/tree/master/smbmkt/models/byd/odata) in the [SAP Businesss ByDesign Odata Services](https://www.youtube.com/watch?v=z6mF_1hFths)
* Activate the models and take note of the service URL
* Upload the [report of prices](https://github.com/B1SA/smbmkt/tree/master/smbmkt/models/byd/reports) on SAP Business ByDesign Business Analytics

 - Configure the ERP products with pictures
In order to find products that are similar to a given input the app needs an "image library" to be used as a comparision by the [SAP Leonardo Similarity Scoring API](https://api.sap.com/shell/discover/contentpackage/SAPLeonardoMLFunctionalServices/api/similarity_scoring_api). In this step we will assign image URL to the ERP items:
* Upload your pictures to an online storage service such as [imgur](imgur.com)  
* Fill the url for your products' images in SAP Business ByDesign (Product Data > Materials > General Information > Details text box)
* Fill the url for your products' images in SAP Business One (Item Master Data > Remarks > text box)

## STEP #2 -  App Configuration and Cloud Deployment
### Create the backing services
This app uses 2 [backing services](https://12factor.net/backing-services) from SAP Cloud Platform. [Redis](https://redis.io) for storing B1 Service Layer Sessions ID in cache and [PostgreSQL](https://www.postgresql.org/) to store [SAP Leonardo Feature Extraction Vectors](https://api.sap.com/api/img_feature_extraction_api/resource). Here are the steps to create them:

Using a command terminal, navigate to the smbmkt root directory, which you downloaded or cloned previously.
Log in the SAP Cloud Platform, Cloud Foundry with your credentials executing this command:
```
$ cf login
```
Create the Redis and PostgreSQL services
```
cf create-service redis v3.0-dev cachedb
cf create-service postgresql v9.6-dev itemsdb
```

### Deploy the app's microservices
This app have 3 microservices that can be deployed at once or separately. Their specifications are detailed in the [manifest.yml](manifest.yml). 
* smbmkt: SMB Marketplace backend service
* XXX_SMBAssistantBot: The SMB Marketplace Assistant Bot on Facebook Messenger
* xxx-shoe-detector-tf: The Image Pre-processing service based on tensorflow object detection api.

From the same terminal of the previous step execute:
```
$ cf push --random-route
```
>*--random-route will avoids name colisions with others that deploy this same app on SCP. You can choose your own app name by changing the application names in the [manifest](manifest.yml)*

Or if you prefer fixed app routes instead of random ones, you can simply replace app names by adding your company namespace to avoid the conflict of route on SAP Cloud Platform, Cloud Foundry. 

For example, your company has a name space as "abc", then the apps can be renamed in [manifest.yml](manifest.yml) as below:
* abc-smbmkt
* abc_SMBAssistantBot
* abc-shoe-detector-tf

Please also update the app names in individual manifest.yml for each service to keep consistent.
* smbmkt: [/smbmkt/smbmkt/manifest.yml](./smbmkt/manifest.yml) 
* XXX_SMBAssistantBot: [/smbmkt/bot/messenger/manifest.yml](./bot/messenger/manifest.yml) 
* xx-shoe-detector-tf: [/smbmkt/detector/tensorflow/manifest.yml](./detector/tensorflow/manifest.yml) 

From the same terminal of the previous step execute without --random-route:
```
$ cf push
```

As a result, now you can find out the urls of your SMB Marketplace backend service, messenger bot, and shoe detector for image pre-processing service. You can also check them with:
```
$ cf apps
```
>At this stage, the bot is not yet functioning due to missing the mandatory configurations, which will be covered on the Assistant Bot configuration section](#Configure-the-SMB-Market-Place-Assistant-Bot)

### Configure the SMB Mktplace backend

Set the following [Environment Variables](https://12factor.net/config) so the app can work properly
```
B1_COMP_ENV: <SAP Business One Company Name>
B1_DEFAULT_BP: <A Business Partner Code for the B1 Sales Order>
B1_USER_ENV: <B1 User to login the Service Layer>
B1_PASS_ENV: <Password for the B1 User>
B1_SERVER_ENV: <SAP Business One server URL>
B1_SLPATH_ENV: /b1s/v1
B1_SLPORT_ENV: <SAP Business One Service Layer Server Port>
BYD_AUTH: <[Base64 Encoded] user:password>
BYD_DEFAULT_BP: <A Business Partner Code for the ByD Sales Order>
BYD_PATH: /sap/byd/odata/cust/v1
BYD_PORT: ""
BYD_SERVER: <SAP Business ByDesign server URL>
FILE_SEP: -_-_
LEO_API_KEY: <SAP Leonardo API Key> 
TEMP_DIR: files/tmp
VECTOR_DIR: files/vectors
```
For Example:
```
$ cf set-env mysmbmkt B1_COMP_ENV SBODEMOUS
```
Restart your application (so it can read the new environment variables)
```
$ cf restart smbmkt
```

You will see your backend URL
For details about app deployment check [Deploying a NodeJS app to SAP Cloud PLatform in this guide](https://github.com/B1SA/B1_SCP_HandsOn/blob/master/HandsOn_SCP_Instructions_v3.pdf)

### Configure the SMB Market Place Assistant Bot
* Follow the [facebook developer manual](https://developers.facebook.com/docs/messenger-platform/getting-started) to create a messenger bot with message and user_location service 

#### For Cloud Foundry Deployment: 
* Update the PAGE_ACCESS_TOKEN and VERIFY_TOKEN for your messenger bot in the bot's [manifest.yml in smbmkt/bot/messenger/](./bot/messenger/manifest.yml), which will be used to setup and verify the webhook to facebook messenger
```yml
"PAGE_ACCESS_TOKEN": "To-Be-Updated: Place the page access token for your own messenger app here"
"VERIFY_TOKEN": "To-Be-Updated: Place the verify token for your own messenger app here"
```
* Update the SMBMKT_BACKEND_URL for your messenger bot in the bot's [manifest.yml in smbmkt/bot/messenger/](./bot/messenger/manifest.yml) with your own smbmkt url from the result of [Deploy the app's microservices](#Deploy-the-app's-microservices), which will be used in facebook messenger bot for all SMB Backend Integration.
```yml
"SMBMKT_BACKEND_URL": "To-Be-Updated: place the url for your own smbmkt backend, which can be deployed through ./smbmkt"
```
* The whole smbmkt solution also includes a shoe detector with 3rd-party object detection API(tensorflow and yolo) for improving the accuracy of image similarity scoring with SAP Leonardo, especially in the following cases. 
>1).False result with no shoe in the image.

>2).Low accuracy of image similarity scoring by massive background surrouding the shoe.

The shoe detector detects the shoe in the image, then crop the bouding box of detect shoe with highest confidence score before handing over to image similarity scoring with SAP Leonardo. We name this feacture as Image Pre-precessing Service.

By default, the Image Pre-precessing Service is disabled on the bot for easy setup.

To enable this Image Pre-precessing Service, please update the ENABLE_DETECTOR as true, and DETECTOR_URL as the url of shoe-detector in the result of [Deploy the app's microservices](#Deploy-the-app's-microservices) in the bot's [manifest.yml in smbmkt/bot/messenger/](./bot/messenger/manifest.yml)
```yml
"ENABLE_DETECTOR": true
"DETECTOR": "tensorflow"
"DETECTOR_URL": "To-Be-Updated: Please place the base url with your own shoe detector, which can be deployed through /smbmkt/detector/tensorflow"
```

As a result, all the environment variables for assistant is configured properly, now you can redploy the bot separately with commands below:
```sh
$ cd ./bot/messenger
$ cf push
```

Or you can set the environment variables and restart the app with commands.

For Example:
```
$ cf set-env abc_SMBAssistantBot PAGE_ACCESS_TOKEN <YOUR_OWN_PAGE_ACCESS_TOKEN>
Repeat for each environment variable listed above.
```

Restart your application (so it can read the new environment variables)
```
$ cf restart abc_SMBAssistantBot
```

#### For On-Premise Deployment: 
you either configure the environment variable every time before running.
```
bash: $ export PAGE_ACCESS_TOKEN <YOUR_OWN_PAGE_TOKEN>
csh:  $ setenv PAGE_ACCESS_TOKEN <YOUR_OWN_PAGE_TOKEN>
Repeat for VERIFY_TOKEN and SMBMKT_BACKEND_URL
```
or simply update the PAGE_ACCESS_TOKEN, VERIFY_TOKEN and SMBMKT_BACKEND_URL on smbmkt/bot/messenger/config.js
```js
exports.smbmkt_root_url = 'To-Be-Updated: place the url for your own smbmkt backend, which can be deployed through ./smbmkt';
exports.AccessToken = 'To-Be-Updated: Place the page access token for your own messenger app here';
exports.VERIFY_TOKEN = 'To-Be-Updated: Place the verify token for your own messenger app here';
```

### Configure the Shoe Detector with Image Pre-processing for more accurate result
Two shoe detecors have been implemented in SMBMKT for your reference.
* [tensorflow](https://github.com/B1SA/smbmkt/tree/master/detector/tensorflow): Shoe detection with tensorflow object detection api. More detail available in [smbmkt/detector/tensorflow](https://github.com/B1SA/smbmkt/tree/master/detector/tensorflow).
* [yolo](https://github.com/B1SA/smbmkt/tree/master/detector/yolo): Shoe detection with yolo object detection. More detail available in [smbmkt/detector/yolo](https://github.com/B1SA/smbmkt/tree/master/detector/yolo).

Both shoe detector has included an ImagePrePrcocess endpoint as:
>POST /ImagePrePrcocess: Detect the objects and crop the bounding box for the detected object with highest detection score, which is used in both assistant bot and smbmkt backend service to detect and crop the shoe in the image before sending to Similarity Scoring API in SAP Leonardo.

The default shoe detector is the tensorflow one, which is incldued in [the manifes.yml](./manifest.yml). If you would like to use the shoe detector with yolo, please refer to [the YOLO detector manual](https://github.com/B1SA/smbmkt/tree/master/detector/yolo) to configure and deploy it, then follow the step [Configure the SMB Market Place Assistant Bot](#Configure-the-SMB-Market-Place-Assistant-Bot) to enable the yolo detector for the SMB Market Place Assistant Bot.

* Configuration of [shoe detector with tensorflow](./detector/tensorflow/manifest.yml):
```yml
- name: xxx-shoe-detector-tf
    "MODEL_NAME": "<The tensorflow model for obejct detection. The default model as ssdlite_mobilenet_v2_shoe(My custom trained model for shoe detection with SSDLite on tensorflow). Please refer to for detail. https://github.com/B1SA/smbmkt/tree/master/detector/tensorflow>"
    "DETECT_THRES": "<The default threshold of object detection. Default as 0.70.>"
```
For example, your company namespace as abc, and desire a detection threshold as 80% you have the [manifest.yml](./detector/tensorflow/manifest.yml) updated as below:
```yml
- name: abc-shoe-detector-tf
    "MODEL_NAME": ssdlite_mobilenet_v2_shoe
    "DETECT_THRES": 0.80
```

then you can deploy the tensorflow shoe detector saperately with commands
```
$ cd ./detector/tensorflow
$ cf push
```

or you can configure the enviroment variable on the fly
```
$ cf set-env abc-shoe-detector-tf DETECT_THRES 0.80
```
Restart your application (so it can read the new environment variables)
```
$ cf restart abc-shoe-detector-tf
```

* Configuration of [shoe detector with yolo](./detector/yolo/manifest.yml):
```yml
- name: <xxx-shoe-detector-yolo, please rename xxx with your company name space>
    "DETECT_THRES": "<The default threshold of object detection. Default as 0.70.>"
    "IMAGE_BASE_URL": "<https://<YOUR_OWN_YOLO_SHOE_DETECTOR_BASE_URL>/Images/, for example, you have your shoe detector deployed as https://xxx-shoe-detector-yolo.cfapps.eu10.hana.ondemand.com, then the image base url is https://xxx-shoe-detector-yolo.cfapps.eu10.hana.ondemand.com/Images/>"
```

then you can deploy the yolo shoe detector saperately with commands
```
$ cd ./detector/yolo
$ cf push
```

## License
SMB Marketplace Assistant prototype is released under the terms of the MIT license. See [LICENSE](LICENSE) for more information or see https://opensource.org/licenses/MIT.
