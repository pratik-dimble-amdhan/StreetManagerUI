sap.ui.define(
    [
        "project1/controller/base/BaseController",
        "sap/ui/core/BusyIndicator",
        "sap/m/MessageBox",
        "project1/services/apiFacade",
        "sap/ui/model/json/JSONModel"
    ],
    
    function(BaseController, BusyIndicator, MessageBox, ApiFacade, JSONModel) {
      "use strict";
  
      /**
       * @class
       * @desc App view controller
       * @extends SAP/UKPN/UI/PermitApplication/base/BaseController
       * @author Manuel Navarro Ruiz
       * @constructor
       * @public
       * @module SAP/UKPN/UI/PermitApplication/controller/App
       */
      return BaseController.extend("project1.controller.App", {
        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */
  
        onInit: function() {
            this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("SapRequest").attachPatternMatched(this.onRoutematch, this);
			this.oRouter.getRoute("NoAuth").attachPatternMatched(this.onNoAuth, this);
        },
  
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */
  
		onNoAuth: function(){
			//MessageBox.error(this.getResourceBundle().getText("noAuthMsg", this.getModel("UserProfileModel").getProperty("/username")));
		},

        onRoutematch: function(oEvent){
			var sapKey = oEvent.getParameter("arguments").sapkey;
			if(sapKey){
				BusyIndicator.show(0);
				ApiFacade.getInstance().getSapKeyApplicationdetails(sapKey)
				.then(function (data) {
							if(!data.errorMessage && !data.applicationId){
								this.getOwnerComponent().setModel(new JSONModel(data), "SAPdataModel");
								if(data.controlKey && data.controlKey.toUpperCase() === "PW01"){
									this.doNavTo("PlannedPrivate", {
										mode: "create",
										NAME1: "sapkey",
										PARAM1: sapKey
									});
								}else{
									this.doNavTo("PlannedPermit", {
										mode: "create",
										NAME1: "sapkey",
										PARAM1: sapKey
									});
								}
							}else if(data.errorMessage){
								BusyIndicator.hide();
								MessageBox.error(data.errorMessage, {
									onClose: function(){
										this.doNavTo("TargetView1");
									}.bind(this)
								});
							}else if(data.applicationId){
								if(data.permitReferenceNumber && data.permitReferenceNumber !== ""){
									this.doNavTo("PermitHistory", {
										tab: "Permitdetails",
										NAME1: "requestId",
										PARAM1: data.applicationId
									});
								}else{
									if(data.controlKey && data.controlKey.toUpperCase() === "PW01"){
										this.doNavTo("PlannedPrivate", {
											mode: "edit",
											NAME1: "ApplicationId",
											PARAM1: data.applicationId
										});
									}else{
										this.doNavTo("PlannedPermit", {
											mode: "edit",
											NAME1: "ApplicationId",
											PARAM1: data.applicationId
										});
									}
								}
							}
						}.bind(this))
						.catch(
							function (oReject) {
								BusyIndicator.hide();
								this.standardAjaxErrorDisplay(oReject);
							}.bind(this)
						);
			}
		}

        /* =========================================================== */
        /* begin: internal methods                                     */
        /* =========================================================== */
  
      });
    }
  );
  