import _ from 'lodash';
import { Meteor } from 'meteor/meteor';
import ComputedFields from './computed-fields.common';

ComputedFields.set = (params) => new ComputedFieldsTriggerable(params);

class ComputedFieldsTriggerable {
  constructor(params) {
    // Params
    this.OriginCollection = params.from;
    this.originFieldName = params.field;
    this.relationField = params.relationField;
    this.DestinationCollection = params.to;
    this.destinationFieldName = params.as;
    this.getDynamicDestinationFieldValue = params.value;
    this.wachedFields = params.watchFields;
    // Binds
    this.setHooks = this.setHooks.bind(this);
    this.getBeforeInsertDestinationHook = this.getBeforeInsertDestinationHook.bind(this);
    this.getBeforeUpdateDestinationHook = this.getBeforeUpdateDestinationHook.bind(this);
    this.getAfterUpdateOriginHook = this.getAfterUpdateOriginHook.bind(this);
    this.getNewValue = this.getNewValue.bind(this);
    this.prepareDestinationValue = this.prepareDestinationValue.bind(this);
    this.updateDestinationValue = this.updateDestinationValue.bind(this);
    this.shouldUpdateDestination = this.shouldUpdateDestination.bind(this);
    this.shouldUpdateDestinationOnOriginHook = this.shouldUpdateDestinationOnOriginHook.bind(this);
    // Preparations
    this.finalDestinationFieldName = 'computed.' + this.destinationFieldName;
    this.usingDynamicValue = this.isUsingDynamicValue();
    // Init
    this.setHooks();
  }

  isUsingDynamicValue() {
    return !!this.getDynamicDestinationFieldValue;
  }

  setHooks() {
    if(!!this.OriginCollection) this.OriginCollection.after.update(this.getAfterUpdateOriginHook());
    if(!!this.DestinationCollection) this.DestinationCollection.before.insert(this.getBeforeInsertDestinationHook());
    if(!!this.DestinationCollection) this.DestinationCollection.before.update(this.getBeforeUpdateDestinationHook());
  }

  getBeforeInsertDestinationHook() {
    const self = this;
    return function(userId, destinationDoc) {
      const fieldNames = _.keys(destinationDoc);
      if(!self.shouldUpdateDestination(fieldNames)) return;
      self.prepareDestinationValue(destinationDoc, destinationDoc, { isInsert: true, isUpdate: false, userId });
    };
  }

  getBeforeUpdateDestinationHook() {
    const self = this;
    return function(userId, destinationDoc, fieldNames, modifier, options) {
      if(!self.shouldUpdateDestination(fieldNames)) return;
      modifier.$set = modifier.$set || {};
      self.prepareDestinationValue(destinationDoc, modifier.$set, { isInsert: false, isUpdate: true, modifier, userId, fieldNames, options });
    };
  }

  getAfterUpdateOriginHook() {
    const self = this;
    return function(userId, originDoc, fieldNames, modifier, options) {
      if(!self.shouldUpdateDestinationOnOriginHook(fieldNames)) return;
      Meteor.defer(() => self.updateDestinationValue(originDoc));
    }
  }

  shouldUpdateDestination(updatedFieldNames) {
    if(this.usingDynamicValue && !this.wachedFields) return true;
    let watchedFields = this.usingDynamicValue ? this.wachedFields : [_.first(_.split(this.relationField, '.'))];
    return !!_.size(_.intersection(updatedFieldNames, watchedFields));
  }

  shouldUpdateDestinationOnOriginHook(updatedFieldNames) {
    let watchOriginFields = _.first(_.split(this.originFieldName, '.'));
    return _.includes(updatedFieldNames, watchedOriginFields);
  }

  getNewValue(destinationDoc, options) {
    if(this.usingDynamicValue) return this.getDynamicDestinationFieldValue(_.merge(options, { docId: destinationDoc._id, doc: destinationDoc }));
    const originDocId = destinationDoc[this.relationField];
    const originDoc = this.OriginCollection.findOne({ _id: originDocId }, { fields: { [this.originFieldName]: 1 } });
    return _.result(originDoc, this.originFieldName);
  }

  prepareDestinationValue(destinationDoc, mutableDoc, options) {
    options = options || {};
    const { isUpdate } = options;
    let newValue = this.getNewValue(destinationDoc, options);
    if(!!isUpdate) return mutableDoc[this.finalDestinationFieldName] = newValue;
    _.set(mutableDoc, this.finalDestinationFieldName, newValue);
  }

  updateDestinationValue(originDoc) {
    const newValue = _.result(originDoc, this.originFieldName);
    this.DestinationCollection.update({ [this.relationField]: originDoc._id }, { $set: { [this.finalDestinationFieldName]: newValue } });
  }
}
