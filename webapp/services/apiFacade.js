sap.ui.define(
	[
		"project1/services/configHelper",
		"project1/services/ajaxCaller",
		"project1/util/Formatter",
		"project1/controller/base/BaseObject"
	],
	function (ConfigHelper, AjaxCaller, formatter, BaseObject) {
		"use strict";

		var oInstance;
		/**
		 * Module for managing the calls of the controllers to the backend server
		 * (input/output mapping, methods, call orchestration...)
		 * @extends com/shell/ds/dis/sent/activation/base/BaseObject
		 * @author Manuel Navarro Ruiz
		 * @class
		 * @public
		 * @module com/shell/ds/dis/sent/activation/services/apiFacade
		 */
		var ApiFacade = BaseObject.extend(
			"project1.services.apiFacade", /** @lends module:com/shell/ds/dis/sent/activation/services/apiFacade# */ {
				/**
				 * Shared app formatter
				 * @type {com.xpr.partner.skeleton.app.util.formatter}
				 */
				formatter: formatter,

				constructor: function () {
					//Call super constructor
					BaseObject.call(this);
				},

				/* =========================================================== */
				/* public methods					            			   */
				/* =========================================================== */

				/**
				 * Method to get application pending activities
				 * @public
				 * @param {String} sApplicationId	Received application id
				 * @return {Promise}            The call promise
				 */
				getApplicationActivities: function (sApplicationId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("ApplicationActivities", "getActivities", [sApplicationId]);
					return AjaxCaller.getInstance()
					.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
					.then(function (oData) {
						return oData;
					}.bind(this));
				},

				/**
				 * Method to clear application pending activity
				 * @public
				 * @param {String} sActivityId		Received activity ID
				 * @param {String} sApplicationId	Received application id
				 * @return {Promise}            The call promise
				 */
				clearApplicationActivity: function (sActivityId, sApplicationId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("ApplicationActivities", "clearActivity", [sApplicationId,
						sActivityId
					]);
					return AjaxCaller.getInstance()
					.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
					.then(function (oData) {
						return oData;
					}.bind(this));
				},

				/**
				 * Method to create application traffic files
				 * @public
				 * @param {Object} oItem			Received file item
				 * @param {String} sApplicationId	Received application id
				 * @return {Promise}            	The call promise
				 */
				createApplicationTrafficFile: function (oItem, sApplicationId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("CreateApplicationTrafficFiles", "createApplicationTrafficFile", [
						sApplicationId
					]);
					var sFUId = oItem.getAssociation("fileUploader");
					var oFU = sap.ui.getCore().byId(sFUId);
					var oFile = oFU.oFileUpload.files[0];
					var formData = new FormData();
					formData.append("file", oFile);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, formData, null, "form", null)
						.then(function (oData) {
							oItem.setAriaLabelForPicture(oData.fileId);
							return oItem;
						}.bind(this));
				},

				/**
				 * Method to create application files
				 * @public
				 * @param {Object} oItem			Received file item
				 * @param {String} sApplicationId	Received application id
				 * @return {Promise}            	The call promise
				 */
				createApplicationFile: function (oItem, sApplicationId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("CreateApplicationFiles", "createApplicationFile", [sApplicationId]);
					var sFUId = oItem.getAssociation("fileUploader");
					var oFU = sap.ui.getCore().byId(sFUId);
					var oFile = oFU.oFileUpload.files[0];
					var formData = new FormData();
					formData.append("file", oFile);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, formData, null, "form", null)
						.then(function (oData) {
							oItem.setAriaLabelForPicture(oData.fileId);
							oItem.setUrl(oData.link);
							return oItem;
						}.bind(this));
				},

				/**
				 * Method to delete application files
				 * @public
				 * @param {String} sFileId			Received file ID
				 * @param {String} sApplicationId	Received application id
				 * @return {Promise}            The call promise
				 */
				deleteApplicationFile: function (sFileId, sApplicationId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("ApplicationFiles", "deleteApplicationFile", [sApplicationId,
						sFileId
					]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to get application file list
				 * @public
				 * @param {String} sApplicationId	Received application id
				 * @return {Promise}            The call promise
				 */
				getApplicationFiles: function (sApplicationId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("ApplicationFiles", "getApplicationFile", [sApplicationId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to obtain site files
				 * @public
				 * @param {String} sApplicationId	Received application id
				 * @param {Object} oSite			Received site object
				 * @return {Promise}            	The call promise
				 */
				getSiteFile: function (sApplicationId, oSite) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("SiteFiles", "getSiteFiles", [sApplicationId, oSite.id]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							var oResponse = {
								sSiteNo: oSite.uiSiteNumber,
								files: []
							};
							aData.forEach(function (oData) {
								oResponse.files.push(new sap.m.UploadCollectionItem({
									fileName: oData.filename,
									ariaLabelForPicture: oData.fileId.toString(),
									url: oData.link,
									enableDelete: oSite.version.toUpperCase() !== "DRAFT" ? false : oSite.id === oData.siteId ? true : false
								}));
							}.bind(this));
							return oResponse;
						}.bind(this));
				},

				/**
				 * Method to create site files
				 * @public
				 * @param {Object} oItem			Received file item
				 * @param {String} sApplicationId	Received application id
				 * @param {String} sSiteId			Received site id
				 * @return {Promise}            	The call promise
				 */
				createSiteFile: function (oItem, sApplicationId, sSiteId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("SiteFiles", "createSiteFile", [sApplicationId, sSiteId]);
					var sFUId = oItem.getAssociation("fileUploader");
					var oFU = sap.ui.getCore().byId(sFUId);
					var oFile = oFU.oFileUpload.files[0];
					var formData = new FormData();
					formData.append("file", oFile);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, formData, null, "form", null)
						.then(function (oData) {
							oItem.mProperties.ariaLabelForPicture = oData.fileId.toString();
							return oItem;
						}.bind(this));
				},

				/**
				 * Method to delete site files
				 * @public
				 * @param {String} sFileId			Received file item
				 * @param {String} sApplicationId	Received application id
				 * @param {String} sSiteId			Received site id
				 * @return {Promise}            	The call promise
				 */
				deleteSiteFile: function (sFileId, sApplicationId, sSiteId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("DeleteSiteFiles", "deleteSiteFile", [sApplicationId, sSiteId, sFileId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to create inspection task files
				 * @public
				 * @param {Object} oItem			Received file item
				 * @param {String} sInspectionId	Received inspection id
				 * @param {String} sTaskId			Received task id
				 * @return {Promise}            	The call promise
				 */
				createInspectionTaskFile: function (oItem, sInspectionId, sTaskId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionTaskFiles", "createInspectionTaskFile", [sInspectionId,
						sTaskId
					]);
					var sFUId = oItem.getAssociation("fileUploader");
					var oFU = sap.ui.getCore().byId(sFUId);
					var oFile = oFU.oFileUpload.files[0];
					var formData = new FormData();
					formData.append("file", oFile);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, formData, null, "form", null)
						.then(function (oData) {
							oItem.setAriaLabelForPicture(oData.fileId);
							return oItem;
						}.bind(this));
				},

				/**
				 * Method to update Site Data
				 * @public
				 * @param {String} appId			Received application id
				 * @param {String} data				Received data
				 * @param {String} siteId			Received site id
				 * @return {Promise}            	The call promise
				 */
				updateSiteData: function (appId, data, siteId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("UpdateSite", "updateSite", [appId, siteId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, data, null, null, null, null, "If-Match")
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to get Site Etag
				 * @public
				 * @param {String} appId			Received application id
				 * @param {String} siteId			Received site id
				 * @return {Promise}            	The call promise
				 */
				getSiteEtag: function (appId, siteId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("UpdateSite", "getEtag", [appId, siteId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to search person responsible
				 * @public
				 * @return {Promise}            The call promise
				 */
				PersonResponsible: function (value) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("PersonResponsibleSearch", "PersonResponsible", [value]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							//return this._changeDatesFromGMT(oData);
							return oData;
						}.bind(this));
				},

				/**
				 * Method to get Inspection TaskType
				 * @public
				 * @return {Promise}            The call promise
				 */
				getInspectionTaskType: function (data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionsTasktypes", "Tasktypes");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to get All Inspection Users for sending emails
				 * @public
				 * @return {Promise}            The call promise
				 */
				getAllInspectionUsers: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionTaskUsers", "Users");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to Creates a new inspection task
				 * @public
				 * @return {Promise}            The call promise
				 */
				createInspectionTask: function (inspectionId, data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("CreateInspectionTask", "CreateTask", [inspectionId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, data, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to Update a inspection task
				 * @public
				 * @return {Promise}            The call promise
				 */
				updateInspectionTask: function (inspectionId, sInspectionTaskId, data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("CreateInspectionTask", "updateTask", [inspectionId, sInspectionTaskId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, data, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to Retrieves all the inspection tasks
				 * @public
				 * @return {Promise}            The call promise
				 */
				getAllInspectionTask: function (inspectionId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("CreateInspectionTask", "getTask", [inspectionId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							oData.forEach(function(oTask){
								oTask.taskDeadline = new Date(oTask.taskDeadline);
							}.bind(this));
							return oData;
						}.bind(this));
				},

				/**
				 * Method to Retrieves all the inspection Contractor tasks
				 * @public
				 * @return {Promise}            The call promise
				 */
				getInspectionContractorTask: function (inspectionId, contractorID) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionContractor", "getInspectionContractor", [inspectionId]);
					oUserDataInfo.url += "?contractorId =" + contractorID;
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to Retrieves one inspection task
				 * @public
				 * @return {Promise}            The call promise
				 */
				getInspectionTask: function (inspectionId, taskId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("CreateInspectionTask", "getTask", [inspectionId, taskId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							oData.taskDeadline = new Date(oData.taskDeadline);
							return oData;
						}.bind(this));
				},

				/**
				 * Method to Retrieves all the inspection types
				 * @public
				 * @return {Promise}            The call promise
				 */
				getInspectionTypes: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionTypes", "InspectionType");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},
				/**
				 * Method to get Inspection Category
				 * @public
				 * @return {Promise}            The call promise
				 */
				getInspectionCategory: function (data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionCategory", "getInspectionCategory");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to get Inspection Outcome
				 * @public
				 * @return {Promise}            The call promise
				 */
				getInspectionOutcome: function (data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionOutcome", "getInspectionOutCome");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},
				/**
				 * Method to get Inspection Coordinator
				 * @public
				 * @return {Promise}            The call promise
				 */
				getInspectionCoordinator: function (data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionCoordinator", "getInspectionCoordinator");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to get Related Permit Number Detail
				 * @public
				 * @return {Promise}            The call promise
				 */
				getRelatedPermitNumberDetail: function (permitNumber) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("RelatedPermitNumberDetail", "getRelatedPermitNumberDetail", [
						permitNumber
					]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},
				getWorkingGroup: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("WorkingGroup", "getWorkingGroup");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},
				CreateInspectionComment: function (applicationId, data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("SaveCreateInspectionComment", "CreateInspectionComment", [applicationId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, data, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},
				CreateInspectionNotes: function (applicationId, data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("SaveCreateInspectionNotes", "CreateInspectionNotes", [applicationId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, data, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				CreateInspection: function (data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("Inspection", "createInspection");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, data, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				UpdateInspection: function (data, inspectionId,bSaveFlag) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("ManualInspection", "updateManualInspection",[inspectionId]);
					oUserDataInfo.url += "?sendMail=" + bSaveFlag;
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, data, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},
				getInspectionDetails: function (inspectionId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionDetails", "getInspectionDetails",[inspectionId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				

				/**
				 * Method to Calculate work category
				 * @public
				 * @return {Promise}            The call promise
				 */
				WorkCategory: function (data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("CalculateWorkCategory", "WorkCategory");
					oUserDataInfo.url += "?workType=" + data.workType + "&isTtroRequired=" + data.isTtroRequired + "&proposedStartDate=" + data.proposedStartDate +
						"&proposedEndDate=" + data.proposedEndDate + "&roadCategory=" + data.roadCategory + "&trafficSensitive=" + data.trafficSensitive;
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},
				/**
				 * Method to Get Inspection Types
				 * @public
				 * @return {Promise}            The call promise
				 */
				InspectionType: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionTypes", "InspectionType");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to search Applications
				 * @public
				 * @return {Promise}            The call promise
				 */
				ApplicationSearch: function (data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("ApplicationSearchDetails", "ApplicationSearch");
					var sUrlParams = "?";
					for (var i in data) {
						if (data[i] && data[i] !== "") {
							if (sUrlParams === "?") {
								sUrlParams += i + "=" + data[i];
							} else {
								sUrlParams += "&" + i + "=" + data[i];
							}
						}
					}
					var sPagination = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("pagination");
					if (sPagination.indexOf("@") !== -1) {
						sPagination = 5;
					}
					sUrlParams += "&top=" + sPagination;
					oUserDataInfo.url += sUrlParams;
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to search Inspection activitites
				 * @public
				 * @param  {object}		data	Filters to apply on search
				 * @return {Promise}            The call promise
				 */
				InspectionActivitiesSearch: function (data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionActivities", "getActivities");
					var sPagination = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("pagination");
					if (sPagination.indexOf("@") !== -1) {
						sPagination = 5;
					}
					data.top = sPagination;
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, data, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to clear inspection pending activity
				 * @public
				 * @param {String} sActivityId		Received activity ID
				 * @param {String} sInspectionId	Received application id
				 * @return {Promise}            The call promise
				 */
				clearInspectionActivity: function (sActivityId, sInspectionId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionActivitiesClear", "clearActivity", [sInspectionId,
						sActivityId
					]);
					return AjaxCaller.getInstance()
					.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
					.then(function (oData) {
						return oData;
					}.bind(this));
				},

				/**
				 * Method to search Inspections
				 * @public
				 * @return {Promise}            The call promise
				 */
				InspectionSearch: function (data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("Inspection", "searchInspections");
					var sUrlParams = "?";
					for (var i in data) {
						if (data[i] && data[i] !== "") {
							if (sUrlParams === "?") {
								sUrlParams += i + "=" + data[i];
							} else {
								sUrlParams += "&" + i + "=" + data[i];
							}
						}
					}
					oUserDataInfo.url += sUrlParams;
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to Retrieves all the inspection tasks
				 * @public
				 * @return {Promise}            The call promise
				 */
				getInspectionTaskStatus: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionTaskStatus", "getTaskStatus");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to obtain Inspection task files
				 * @public
				 * @param {String} inspectionId	Received
				 * @return {Promise}            	The call promise
				 */
				getInspectionTaskFile: function (task, inspectionId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionTaskFiles", "getInspectionTaskFiles", [inspectionId, task.inspectionTaskId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							var oResponse = {
								inspectionTaskId: task.inspectionTaskId,
								files: []
							};
							aData.forEach(function (oData) {
								oResponse.files.push(new sap.m.UploadCollectionItem({
									fileName: oData.filename,
									ariaLabelForPicture: oData.fileId.toString(),
									url: oData.link
								}));
							}.bind(this));
							return oResponse;
						}.bind(this));
				},

				/**
				 * Method to obtain Inspection due date calculation
				 * @public
				 * @param {String} category, outcome & type Received
				 * @return {Promise}            	The call promise
				 */
				getInspectionduedatecalculation: function (type, category, outcome, date) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("DuedateCalculation", "getDuedateCalculation");
					oUserDataInfo.url += "?category=" + category + "&outcome=" + outcome + "&type=" + type + "&date=" + date;
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to create inspection files
				 * @public
				 * @param {Object} oItem			Received file item
				 * @param {String} sInspectionId	Received inspection id
				 * @return {Promise}            	The call promise
				 */
				createInspectionFile: function (oItem, sInspectionId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionFiles", "createInspectionFile", [sInspectionId]);
					var sFUId = oItem.getAssociation("fileUploader");
					var oFU = sap.ui.getCore().byId(sFUId);
					var oFile = oFU.oFileUpload.files[0];
					var formData = new FormData();
					formData.append("file", oFile);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, formData, null, "form", null)
						.then(function (oData) {
							oItem.setAriaLabelForPicture(oData.fileId);
							return oItem;
						}.bind(this));
				},

				/**
				 * Method to get inspection files
				 * @public
				 * @param {String} sInspectionId	Received inspection id
				 * @return {Promise}            	The call promise
				 */
				getInspectionFiles: function (sInspectionId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionFiles", "getInspectionFile", [sInspectionId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, "form", null)
						.then(function (aData) {
							var aFiles = [];
							aData.forEach(function (oData) {
								aFiles.push(new sap.m.UploadCollectionItem({
									fileName: oData.filename,
									ariaLabelForPicture: oData.fileId.toString(),
									url: oData.link
								}));
							}.bind(this));
							return aFiles;
						}.bind(this));
				},

				/**
				 * Method to Retrieves all the inspection DNO
				 * @public
				 * @return {Promise}            The call promise
				 */
				InspectionsDNO: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionsDNODetails", "InspectionsDNO");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to obtain start the Permit
				 * @public
				 * @param {String} inspectionId	Received
				 * @return {Promise}            	The call promise
				 */
				createStartStopPermit: function (appId, date, permit) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("StartStopPermit", "sendStartStopPermit", [appId]);
					oUserDataInfo.url += permit.toLowerCase() + "?date=" + date;
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},

				/**
				 * Method to obtain get contractors
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getAllContractors: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("Contractors", "getContractors");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain get WorkIdentifier
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getWorkIdentifier: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("WorkIdentifier", "getWorkIdentifier");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain get HighwayAuthority
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getHighwayAuthority: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("highwayAuthority", "getHighwayAuthority");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain get WorkIdentifier
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getCollaborationType: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("CollaborationType", "getCollaborationType");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain get WorkIdentifier
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getHighwayAuthoritycomments: function (appId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("SaveCreateInspectionComment", "getcommentstoHighwayAuthority", [appId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain Application details
				 * @public
				 * @param  {string}		appId Application Id to get
				 * @return {Promise}            	The call promise
				 */
				getApplicationdetails: function (appId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("Applications", "getApplication", [appId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain Application event history
				 * @public
				 * @param  {string}		appId Application Id to get history
				 * @return {Promise}            	The call promise
				 */
				getEventHistory: function (appId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("AppHistory", "GetHistory", [appId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain Application version history
				 * @public
				 * @param  {string}		appId Application Id to get history
				 * @return {Promise}            	The call promise
				 */
				getVersionHistory: function (appId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("VersionHistory", "GetHistory", [appId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain Sites history
				 * @public
				 * @param  {string}		appId Application Id to get history
				 * @return {Promise}            	The call promise
				 */
				getSitestHistory: function (appId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("SitesHistory", "GetHistory", [appId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain Site version history
				 * @public
				 * @param  {string}		appId Application Id to get history
				 * @param  {string}		siteId Site Id to get history
				 * @return {Promise}            	The call promise
				 */
				getSiteVersionHistory: function (appId, siteId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("SiteVersionHistory", "GetHistory", [appId, siteId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain Inspection units
				 * @public
				 * @param  {string}		appId Application Id to get units
				 * @return {Promise}            	The call promise
				 */
				getInspectionUnits: function (appId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionUnits", "GetUnits", [appId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to create an application
				 * @public
				 * @param  {string}		oData Data for the new application
				 * @return {Promise}            	The call promise
				 */
				createApplication: function (oData) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("Applications", "createApplication");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, oData, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to update an application
				 * @public
				 * @param  {string}		appId Application Id to get
				 * @param  {string}		oData Data for the update of the application
				 * @return {Promise}            	The call promise
				 */
				updateApplication: function (appId, oData) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("Applications", "updateApplication", [appId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, oData, null, null, null, null, "If-Match")
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to Submit a Permit
				 * @public
				 * @param  {string}		appId Application Id to submit
				 * @return {Promise}            	The call promise
				 */
				submitApplication: function (appId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("submitApplication", "submitPermit", [appId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null, null, "If-Match")
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to discard Application draft
				 * @public
				 * @return {Promise}            	The call promise
				 */
				discardApplicationDraft: function (appId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("Applications", "DiscardDraft", [appId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to discard Alteration draft
				 * @public
				 * @return {Promise}            	The call promise
				 */
				discardAlterationDraft: function (appId, alterationId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("updatePermit", "discardAlterDraft", [appId, alterationId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain Application details from sap key
				 * @public
				 * @param  {String}	sapKey Sapkey to search for
				 * @return {Promise}            	The call promise
				 */
				getSapKeyApplicationdetails: function (sapKey) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("SapKeyDetails", "getSapKeyDetails", [sapKey]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain User Profile from backend
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getUserProfile: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("userProfile", "getUserProfile");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain calculated days
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getCalculatedDays: function (sFrom, sTo) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("calculateDays", "getCalculatedDays");
					oUserDataInfo.url += "?fromDate=" + sFrom + "&toDate=" + sTo;
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain Static Data
				 * @public
				 * @param {String} sDomain Static data domain to obtain
				 * @return {Promise}            	The call promise
				 */
				getStaticData: function (sDomain) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("StaticData", "getData", [sDomain]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain Static Data
				 * @public
				 * @param {String} sDomain Static data domain to obtain
				 * @return {Promise}            	The call promise
				 */
				getStaticDataMappging: function (sDomain) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("StaticDataMapping", "getData", [sDomain]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to obtain Special Designations Static Data
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getSpecialDesignationStaticData: function () {
					var aPromises = [];
					aPromises.push(this.getStaticData("SPECIAL_DESIGNATION_TYPE"));
					aPromises.push(this.getStaticData("SPECIAL_DESIGNATION_PERIODICITY"));
					return Promise.all(aPromises)
						.then(function (aData) {
							var oTypes = {};
							var oPeriodicities = {};
							aData[0].forEach(function (oType) {
								oTypes[oType.key] = oType;
							});
							aData[1].forEach(function (oPeriod) {
								oPeriodicities[oPeriod.key] = oPeriod;
							});
							return {
								types: oTypes,
								periods: oPeriodicities
							};
						}.bind(this));
				},
				/**
				 * Method to Alter Permit
				 * @public
				 * @return {Promise}            	The call promise
				 */
				createAlterPermit: function (appId, data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("alterPermit", "createAlterPermit", [appId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, data, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to Update Permit
				 * @public
				 * @return {Promise}            	The call promise
				 */
				updateAlterPermit: function (appId, data, alterationId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("updatePermit", "updateAlterPermit", [appId, alterationId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, data, null, null, null, null, "If-Match")
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to Submit Permit
				 * @public
				 * @return {Promise}            	The call promise
				 */
				submitAlterPermit: function (appId, alterationId) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("submitPermit", "submitAlterPermit", [appId, alterationId]);
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null, null, "If-Match")
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to update jointing date
				 * @public
				 * @return {Promise}            	The call promise
				 */
				updateJointingDate: function (appId, data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("updateJointingDate", "updateJointingDate", [appId]);
					if (data !== "") {
						oUserDataInfo.url += "?date=" + data;
					}
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to pass action to the Permit(Start, Stop, Revert Start, Revert Stop, Cancel)
				 * @public
				 * @param {String} inspectionId	Received
				 * @return {Promise}            	The call promise
				 */
				createActionpPermit: function (appId, action, data) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("ActionPermit", "sendActionPermit", [appId]);
					oUserDataInfo.url += action;
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, data, null, null, null)
						.then(function (oData) {
							return oData;
						}.bind(this));
				},
				/**
				 * Method to get activities
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getActivity: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("Activities", "getActivities");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to get Contractors
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getContractorAll: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("Contractors", "getContractors");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to get TrafficManagement
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getTrafficManagement: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("TrafficManagement", "getTrafficManagement");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to get OperationalZone
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getOperationalZone: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("InspectionsDNODetails", "InspectionsDNO");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to get LocationType
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getLocationType: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("LocationType", "getLocationType");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to get Permitconditions
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getPermitconditions: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("Permitconditions", "getPermitconditions");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to get FootwayClosure
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getFootwayClosure: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("FootwayClosure", "getFootwayClosure");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to get WRP flag
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getWRPflag: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("WRPflag", "getWRPflag");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to get Authority Contact
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getAuthorityContact: function (swacode) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("AuthorityContact", "getAuthorityContact");
					if(swacode){
						oUserDataInfo.url += "?swaCode=" + swacode;
					}
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},
				/**
				 * Method to obtain get Department Identifier
				 * @public
				 * @return {Promise}            	The call promise
				 */
				getDepartmentIdentifier: function () {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("DepartmentIdentifier", "getDepartmentIdentifier");
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				},

				/**
				 * Method to check if ETON already exists on DFT
				 * @public
				 * @param {String} sEton received ETON
				 * @return {Promise}     The call promise
				 */
				checkETON: function (sEton) {
					var oUserDataInfo = ConfigHelper.getInstance().getCallData("WorkReference", "checkWorkReference");
					oUserDataInfo.url += "?workReferenceNumber=" + sEton;
					return AjaxCaller.getInstance()
						.requestRestAjax(oUserDataInfo.method, oUserDataInfo.url, null, null, null, null)
						.then(function (aData) {
							return aData;
						}.bind(this));
				}

				/* =========================================================== */
				/* private methods					            			   */
				/* =========================================================== */
			}
		);

		return /** @lends module:com/shell/ds/dis/sent/activation/services/apiFacade */ {
			/**
			 * Method to retrieve single instance for class
			 * @public
			 * @return {SAP.UKPN.UI.PermitApplication.services.apiFacade} The APIFacade instance
			 */
			getInstance: function () {
				if (!oInstance) {
					oInstance = new ApiFacade();
				}
				return oInstance;
			}
		};
	});