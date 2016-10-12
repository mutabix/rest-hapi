/**
 * Created by zacharysmith on 11/12/15.
 */
var Joi = require('joi');
var _ = require('lodash');
var assert = require('assert');
var mongoose = require('mongoose');

module.exports = function () {

  return {
    generateJoiReadModel:function(model){
      var readModelBase = {};
      
      var fields = model.schema.paths;

      var associations = Object.keys(model.schema.methods.routeOptions.associations);

      for(var fieldName in fields){
        var field = fields[fieldName].options;

        var isAssociation = associations.indexOf(fields[fieldName].path);

        if(field.readModel){
          readModelBase[fieldName] = field.readModel;
        }else if(field.allowOnRead !== false && field.exclude !== true && isAssociation < 0){
          var attributeReadModel = this.generateJoiModelFromAttribute(field);

          if(field.requireOnRead === true){
            attributeReadModel = attributeReadModel.required();
          }else{
            attributeReadModel = attributeReadModel.optional();
          }

          readModelBase[fieldName] = attributeReadModel;
        }
      }
      
      var modelMethods = model.schema.methods;
      
      if(modelMethods.routeOptions && modelMethods.routeOptions.associations){
        for(var associationName in modelMethods.routeOptions.associations){
          var association = modelMethods.routeOptions.associations[associationName];

          if(association.type == "MANY"){
            readModelBase[associationName] = Joi.array().items(Joi.object().unknown()).optional();
          }else{
            readModelBase[associationName] = Joi.object().unknown().allow(null).optional();
          }
        }
      }

      if(modelMethods.extraReadModelAttributes){
        _.extend(readModelBase, modelMethods.extraReadModelAttributes);
      }

      var readModel = Joi.object(readModelBase).meta({
        className: model.modelName + "ReadModel"
      });

      return readModel;
    },
    generateJoiUpdateModel:function(model){
      var updateModelBase = {};

      var fields = model.schema.paths;
      var associations = model.schema.methods.routeOptions.associations;


      for (var fieldName in fields) {
        var field = fields[fieldName].options;
        var association = associations[fields[fieldName].path] || {};

        if (fieldName !== "__t" && fieldName !== "__v") {
          if(field.updateModel){
            updateModelBase[fieldName] = field.updateModel;
          } else if (!field.primaryKey && field.allowOnUpdate !== false && association.type !== "MANY_MANY") {
            var attributeUpdateModel = this.generateJoiModelFromAttribute(field);

            if(field.requireOnUpdate === true) {
              attributeUpdateModel = attributeUpdateModel.required();
            } else {
              attributeUpdateModel = attributeUpdateModel.optional();
            }

            updateModelBase[fieldName] = attributeUpdateModel;
          }
        }
      }

      var modelMethods = model.schema.methods;

      if (modelMethods.extraUpdateModelAttributes){
        _.extend(updateModelBase, modelMethods.extraUpdateModelAttributes);
      }

      var updateModel = Joi.object(updateModelBase).meta({
        className: model.modelName + "UpdateModel"
      }).optional();

      return updateModel;
    },
    generateJoiCreateModel:function(model){
      var createModelBase = {};

      var fields = model.schema.paths;
      var associations = model.schema.methods.routeOptions.associations;


      for(var fieldName in fields){

        var field = fields[fieldName].options;
        var association = associations[fields[fieldName].path] || {};


        if (fieldName !== "__t" && fieldName !== "__v") {
          if (field.createModel) {
            createModelBase[fieldName] = field.createModel;
          } else if (!field.primaryKey && field.allowOnCreate !== false && association.type !== "MANY_MANY") {
            var attributeCreateModel = this.generateJoiModelFromAttribute(field);

            if ((field.allowNull === false && !field.default && !field._autoGenerated) || field.requireOnCreate === true) {
              attributeCreateModel = attributeCreateModel.required();
            } else {
              attributeCreateModel = attributeCreateModel.optional();
            }

            createModelBase[fieldName] = attributeCreateModel;
          }
        }
      }

      var modelMethods = model.schema.methods;

      if(modelMethods.extraCreateModelAttributes){
        _.extend(createModelBase, modelMethods.extraCreateModelAttributes);
      }

      var createModel = Joi.object(createModelBase).meta({
        className: model.modelName + "CreateModel"
      });

      return createModel;
    },
    generateJoiAssociationModel:function(model){
      var associationModelBase = {};

      for(var fieldName in model.Schema){

        var field = model.Schema[fieldName];

          var attributeAssociationModel = this.generateJoiModelFromAttribute(field);

          if((field.allowNull === false && !field.default && !field._autoGenerated) || field.requireOnAssociation === true){
            attributeAssociationModel = attributeAssociationModel.required();
          }else{
            attributeAssociationModel = attributeAssociationModel.optional();
          }
          associationModelBase[fieldName] = attributeAssociationModel;
      }

      if(model.extraAssociationModelAttributes){
        _.extend(associationModelBase, modelMethods.extraAssociationModelAttributes);
      }

      var associationModel = Joi.object(associationModelBase).meta({
        className: model.modelName + "AssociationModel"
      });

      return associationModel;
    },
    generateJoiModelFromAttribute:function(attribute){
      var model;

      switch(attribute.type.schemaName){
        case 'ObjectId':
          model = Joi.string();//TODO: properly validate ObjectIds
          break;
        case 'Boolean':
          model = Joi.bool();
          break;
        case 'Number':
          model = Joi.number();
          break;
        // case Sequelize.INTEGER.key:
        //   model = Joi.number().integer();
        //   break;
        case 'Date':
          model = Joi.date();
          break;
        // case Sequelize.ENUM.key:
        //   model = Joi.string().valid(attribute.values);
        //   break;
        default:
          model = Joi.string();

          if(!attribute.notEmpty){
            model = model.allow('');
          }

          break;
      }

      if(attribute.allowNull){
        model = model.allow(null);
      }

      return model;
    }
  }
};