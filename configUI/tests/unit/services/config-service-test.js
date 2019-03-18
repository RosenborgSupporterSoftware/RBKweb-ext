import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | config-service', function(hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function(assert) {
    let service = this.owner.lookup('service:config-service');
    assert.ok(service, "The service exists in the application");
  });
});
