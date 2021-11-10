sap.ui.define([
	"project1/controller/base/BaseController",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"project1/services/apiFacade",
	"sap/ui/core/BusyIndicator",
	"project1/util/Formatter"
], function (BaseController, MessageBox, MessageToast, JSONModel, ApiFacade, BusyIndicator, Formatter) {
	"use strict";

	return BaseController.extend("project1.controller.InspectionActivities", {
		formatter: Formatter,
		StartStopPermitDialog: null,
		startStopPermit: "",
		TableselectedRow: null,
		aOldAttachments: [],
		oInsItemIndex: [],
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("InspectionActivities").attachPatternMatched(this.onRoutemacth, this);
			this.createmodel();
		},

		onRoutemacth: function (oEvent) {
			this.createmodel();
			this.getInspectionType();
			this.getDNO();
			this.getWorkingGroup();
			this.getTaskStatus();
			this.getTaskType();
			this.getCoordinators();
			this.getHighwayAuthorities();
			this.getInspectionOutcome();
			this.getInspectionCategory();
			this.clearData();
			this.getView().getModel("ExtendPermitModel").setProperty("/permitDetailClicked", false);
			this.getView().getModel("PermitJointingModel").setProperty("/permitDetailClicked", false);
			this.getView().getModel("oModel").setProperty("/isPrivateFault", false);
		},
		createmodel: function () {
			var oDate = new Date();
			oDate.setHours(0);
			oDate.setMinutes(0);
			oDate.setSeconds(0);
			oDate.setMilliseconds(0);
			var data = {
				SearchArray: [],
				searchButton: true,
				activityType: "Task",
				filters: {
					received: {},
					status: ["OPEN"],
					dueDate: oDate
				}
			};
			var oModel = new JSONModel(data);
			this.getView().setModel(oModel, "SearchModel");
		},
		//Clear Data//
		clearData: function (bKeepTable) {
			var oDate = new Date();
			oDate.setHours(0);
			oDate.setMinutes(0);
			oDate.setSeconds(0);
			oDate.setMilliseconds(0);
			if(bKeepTable){
				this.getView().byId("idSearchTable").setVisible(true);
			}else{
				this.getView().byId("idSearchTable").setVisible(false);
			}
			var oModelData = this.getModel("SearchModel").getData();
			var data = {
				InspectionType: oModelData.InspectionType,
				SearchArray: oModelData.SearchArray,
				InspectionStatus: oModelData.InspectionStatus,
				searchButton: false,
				activityType: oModelData.activityType,
				taskTypeList: oModelData.taskTypeList,
				TaskStatus: oModelData.TaskStatus,
				inspectionCoordinator: oModelData.inspectionCoordinator,
				InspectionOutcomes: oModelData.InspectionOutcomes,
				InspectionCategories: oModelData.InspectionCategories,
				DNO: oModelData.DNO,
				highwayAuthority: oModelData.highwayAuthority,
				filters: {
					received: {}
				}
			};
			if(oModelData.activityType === "Task" || oModelData.activityType === "Task_comment"){
				data.filters.status = ["OPEN"];
				data.searchButton = true;
			}
			if(oModelData.activityType === "Task"){
				data.filters.dueDate = oDate;
				data.searchButton = true;
			}
			var oModel = new JSONModel(data);
			this.getView().setModel(oModel, "SearchModel");
		},
		//Get Inspection Type//
		getInspectionType: function (event) {
			var oCreatePromise = ApiFacade.getInstance().InspectionType();
			oCreatePromise.then(function (data) {
					this.getView().getModel("SearchModel").setProperty("/InspectionType", data);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject)
					}.bind(this)
				);
		},
		//Get Application after search
		getApplicationSearch: function (event) {
			var oModelData = this.getModel("SearchModel").getData();
			var oData = oModelData.filters;
			oData.activityType = oModelData.activityType;
			this._oFilters = oData;
			BusyIndicator.show(0);
			ApiFacade.getInstance().InspectionActivitiesSearch(oData)
			.then(function (data) {
					if (data.content.length === 0) {
						MessageBox.information(this.getModel("i18n").getResourceBundle().getText("resultnotfound"));
					}
					this.getView().getModel("SearchModel").setProperty("/SearchArray", data.content);
					this.getView().getModel("SearchModel").setProperty("/totalElements", data.totalElements);
					this.getView().getModel("SearchModel").updateBindings();
					this.getView().byId("idSearchTable").setVisible(true);
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject)
					}.bind(this)
				);
		},

		loadPaginationItems: function () {
			BusyIndicator.show(0);
			var oModelData = this.getModel("SearchModel").getData();
			var aCurrentElements = oModelData.SearchArray;
			if (this._oFilters && aCurrentElements) {
				var oData = JSON.parse(JSON.stringify(this._oFilters));
				oData["skip"] = aCurrentElements.length;
				var oCreatePromise;
				ApiFacade.getInstance().InspectionActivitiesSearch(oData)
				.then(function (data) {
						if (JSON.stringify(oModelData.SearchArray) !== JSON.stringify(data.content)) {
							data = oModelData.SearchArray.concat(data.content);
						} else {
							data = data.content;
						}
						this.getView().getModel("SearchModel").setSizeLimit(data.length);
						this.getView().getModel("SearchModel").setProperty("/SearchArray", data);
						this.getView().getModel("SearchModel").updateBindings();
						BusyIndicator.hide();
					}.bind(this))
					.catch(
						function (oReject) {
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject)
						}.bind(this)
					);
			}
		},

		onPressClearActivity: function (oEvent) {
			var sInspectionId = oEvent.getSource().getBindingContext("SearchModel").getObject().inspectionId;
			var sActivityId = oEvent.getSource().getBindingContext("SearchModel").getObject().pendingActivityId;
			BusyIndicator.show(0);
			ApiFacade.getInstance().clearInspectionActivity(sActivityId, sInspectionId)
				.then(function (oData) {
					var aData = this.getModel("SearchModel").getData().SearchArray;
					var iFound;
					for(var i in aData){
						if(aData[i].pendingActivityId === sActivityId){
							iFound = i;
						}
					}
					if(iFound){
						aData.splice(iFound, 1);
					}
					this.getModel("SearchModel").setProperty("/SearchArray", aData);
					this.getModel("SearchModel").updateBindings();
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		//Inspections DNO
		getDNO: function (event) {
			var oCreatePromise = ApiFacade.getInstance().InspectionsDNO();
			oCreatePromise.then(function (data) {
					var uniqueArray = [];
					var filterArray = [];
					for (var i = 0; i < data.length; i++) {
						if (uniqueArray.indexOf(data[i].dno) === -1) {
							uniqueArray.push(data[i].dno);
							filterArray.push(data[i]);
						}
					}
					this.getView().getModel("SearchModel").setProperty("/DNO", filterArray);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject)
					}.bind(this)
				);
		},
		getWorkingGroup: function () {
			var oCreatePromise = ApiFacade.getInstance().getWorkingGroup();
			oCreatePromise.then(function (data) {
					var model = new JSONModel(data);
					model.setSizeLimit(data.length);
					this.getView().setModel(model, "SuggestModel");
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject)
					}.bind(this)
				);

		},

		getTaskStatus: function () {
			var oCreatePromise = ApiFacade.getInstance().getInspectionTaskStatus();
			oCreatePromise.then(function (data) {
					this.getView().getModel("SearchModel").setProperty("/TaskStatus", data);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		getTaskType: function () {
			var oCreatePromise = ApiFacade.getInstance().getInspectionTaskType();
			oCreatePromise.then(function (data) {
					this.getView().getModel("SearchModel").setProperty("/taskTypeList", data);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		getCoordinators: function () {
			var oCreatePromise = ApiFacade.getInstance().getInspectionCoordinator();
			oCreatePromise.then(function (data) {
					var uniqueArr = [];
					var filterArr = [];
					data.forEach(function (param) {
						if (uniqueArr.indexOf(param.complianceTeam) === -1) {
							uniqueArr.push(param.complianceTeam);
							filterArr.push(param);
						}
					});
					this.getView().getModel("SearchModel").setProperty("/inspectionCoordinator", filterArr);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		getHighwayAuthorities: function () {
			var oCreatePromise = ApiFacade.getInstance().getHighwayAuthority();
			oCreatePromise.then(function (data) {
					this.getView().getModel("SearchModel").setProperty("/highwayAuthority", data);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
			return oCreatePromise;
		},

		getInspectionOutcome: function(){
			var oCreatePromise = ApiFacade.getInstance().getInspectionOutcome();
			oCreatePromise.then(function (data) {
					this.getView().getModel("SearchModel").setProperty("/InspectionOutcomes", data);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
			return oCreatePromise;
		},

		getInspectionCategory: function(){
			var oCreatePromise = ApiFacade.getInstance().getInspectionCategory();
			oCreatePromise.then(function (data) {
					this.getView().getModel("SearchModel").setProperty("/InspectionCategories", data);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
			return oCreatePromise;
		},

		//Public Function//
		onHome: function () {
			this.clearData();
			this.oRouter.navTo("RouteHome", null, true);
		},

		onSelectSearchfor: function () {
			this.clearData();
		},

		onExport: function(){
			this.exportTableToExcel("idSearchViewTable", this.getResourceBundle().getText("Pendingactivities") + ".xlsx");
		},

		handleUserInput: function (oEvent) {
			if(oEvent.getSource().getDateValue){
				this.getModel("SearchModel").setProperty(oEvent.getSource().getBindingPath("dateValue"), oEvent.getSource().getDateValue());
			}else if(oEvent.getSource().getSelectedKey){
				this.getModel("SearchModel").setProperty(oEvent.getSource().getBindingPath("selectedKey"), oEvent.getSource().getSelectedKey());
			}else if(oEvent.getSource().getSelectedKeys){
               this.getModel("SearchModel").setProperty(oEvent.getSource().getBindingPath("selectedKeys"), oEvent.getSource().getSelectedKeys());
			}else{
				this.getModel("SearchModel").setProperty(oEvent.getSource().getBindingPath("value"), oEvent.getSource().getValue());
			}
			if(oEvent.getSource().getSecondDateValue){
				this.getModel("SearchModel").setProperty(oEvent.getSource().getBindingPath("secondDateValue"), oEvent.getSource().getSecondDateValue());
			}	
			this._onValidationSearchButton();
		},

		onSearchSelect: function (evt) {
			if (evt.getParameters().selected === true && this.getView().getModel("SearchModel").getProperty("/activityType") === "Task") {
				this.getView().getModel("SearchModel").setProperty("/searchButton", true);
			} else {
				this.getView().getModel("SearchModel").setProperty("/searchButton", false);
			}
			this._onValidationSearchButton();
		},

		_onValidationSearchButton: function () {
			var bEnabled = false;
			var oModelData = this.getModel("SearchModel").getData().filters;
			for (var i in oModelData) {
				if(oModelData[i] instanceof Array){
					if(oModelData[i].length > 0){
						bEnabled = true;
					}
				}else if(oModelData[i] instanceof Object && !(oModelData[i] instanceof Date)){
					for (var a in oModelData[i]) {
						if (oModelData[i][a] && ((typeof oModelData[i][a] === "string" && oModelData[i][a] !== "") || oModelData[i][a] instanceof Date)) {
							bEnabled = true;
						}
					}
				}else{
					if (i !== "top" && i !== "activityType" && oModelData[i] && ((typeof oModelData[i] === "string" && oModelData[i] !== "") || oModelData[i] instanceof Date)) {
						bEnabled = true;
					}
				}
			}
			this.getView().getModel("SearchModel").setProperty("/searchButton", bEnabled);
		},

		onPressCreatePermit: function (bContinue) {
			if (bContinue) {
				if (this.TableselectedRow.newPhaseWorkType.toLowerCase() === "immediate") {
					this.doNavTo("FaultPermit", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.newPhaseApplicationId
					});
				} else if(this.TableselectedRow.newPhaseWorkType.toLowerCase() === "planned"){
					this.doNavTo("PlannedPermit", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.newPhaseApplicationId
					});
				} else if(this.TableselectedRow.newPhaseWorkType.toLowerCase() === "private_immediate"){
					this.doNavTo("FaultPrivate", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.newPhaseApplicationId
					});
				} else if(this.TableselectedRow.newPhaseWorkType.toLowerCase() === "private_planned"){
					this.doNavTo("PlannedPrivate", {
						mode: "edit",
						NAME1: "ApplicationId",
						PARAM1: this.TableselectedRow.newPhaseApplicationId
					});
				}
			} else {
				if (!this.createPermitDialog) {
					this.createPermitDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.CreatePermit", this);
					this.getView().addDependent(this.createPermitDialog);
				}
				this.getView().getModel("SearchModel").setProperty("/createpermitselectedKey", "");
				this.createPermitDialog.open();
			}
		},

		oncreateCancel: function () {
			this.createPermitDialog.close();
			this.createPermitDialog.destroy();
			this.createPermitDialog = null;
		},

		onPressCreateConfirm: function () {
			var selectedkey = this.getView().getModel("SearchModel").getProperty("/createpermitselectedKey");
			this.createPermitDialog.close();
			this.createPermitDialog.destroy();
			this.createPermitDialog = null;
			if (selectedkey === "CreatePermit") {
				if(this.TableselectedRow.workType.toLowerCase().indexOf("private") !== -1){
					this.doNavTo("PlannedPrivate", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				}else{
					this.doNavTo("PlannedPermit", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				}
			} else if (selectedkey === "FaultPermit") {
				if(this.TableselectedRow.workType.toLowerCase().indexOf("private") !== -1){
					this.doNavTo("FaultPrivate", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				}else{
					this.doNavTo("FaultPermit", {
						mode: "create",
						NAME1: "PermitReference",
						PARAM1: this.TableselectedRow.permitReferenceNumber
					});
				}
			} else {
				MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("CreatePermit_Error"));
			}
		},

		_getDueDateCalculation: function (isInstype, isCategory, isOutcome, isDate, index) {
			if (isInstype !== null && isCategory !== null && isOutcome !== null) {
				var oCreatePromise = ApiFacade.getInstance().getInspectionduedatecalculation(isInstype, isCategory, isOutcome, isDate);
				oCreatePromise.then(function (data) {
						if (data.dueDate !== "N/A") {
							this.getView().getModel("SearchModel").setProperty("/SearchArray/" + index + "/dueDate", moment(data.dueDate).format(
								'DD MMM YYYY HH:mm'));
						}
					}.bind(this))
					.catch(
						function (oReject) {
							this.standardAjaxErrorDisplay(oReject)
						}.bind(this)
					);
			}
		},

		onPressSort: function(oEvent, sField, sType) {
			var oIcon = oEvent.getSource();
			var sIconSrc = oIcon.getSrc();
			this.resetSortIcons();
			
			var aData = this.getModel("SearchModel")
			  .getProperty("/SearchArray");
			
			var aComparator = aData[0][sField];
			var bSort = aData.reduce(function(acc, value) {
			  var bCurrentSort = false;
			  if (value[sField] !== aComparator || acc) {
				bCurrentSort = true;
			  }
			  aComparator = value[sField];
			  return bCurrentSort;
			}, false);
			
			if (bSort) {
			  aData.sort(function(a, b) {
				var aField = a[sField];
				var bField = b[sField];
			
				if (sType === "date") {
				  aField = new Date(aField).getTime();
				  bField = new Date(bField).getTime();
				}
			
				if (
				  sIconSrc === "sap-icon://sort" ||
				  sIconSrc === "sap-icon://sort-descending"
				) {
				  if (aField > bField) {
					return 1;
				  } else if (bField > aField) {
					return -1;
				  }
				} else if (sIconSrc === "sap-icon://sort-ascending") {
				  if (aField < bField) {
					return 1;
				  } else if (bField < aField) {
					return -1;
				  }
				}
				return 0;
			  });
			}
			this.getModel("SearchModel").updateBindings();
			if (
			  sIconSrc === "sap-icon://sort" ||
			  sIconSrc === "sap-icon://sort-descending"
			) {
			  oIcon.setSrc("sap-icon://sort-ascending");
			} else if (sIconSrc === "sap-icon://sort-ascending") {
			  oIcon.setSrc("sap-icon://sort-descending");
			}
		},

		resetSortIcons: function(){
			var aDomIcons = Array.prototype.slice.call(
			  document.getElementsByClassName("sortingIcon")
			);
			var aIcons = aDomIcons.map(function(oDomIcon) {
			  return sap.ui.getCore().byId(oDomIcon.id);
			});
			
			aIcons.forEach(function(oSelectedIcon) {
			  oSelectedIcon.setSrc("sap-icon://sort");
			});
		},

		onPressInspectionDetail: function(oEvent){
			var sInspectionId = oEvent.getSource().getBindingContext("SearchModel").getObject().inspectionId;
			this.doNavTo("Inspection", {
				state: sInspectionId,
				mode: "inspection-detail"
			});
		}
	});
});