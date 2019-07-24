/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2018-2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([

    'lodash',
    'util/url',
    'taoQtiTestPreviewer/previewer/config/qtiPreviewerServiceConfig'
], function(_, urlUtil, previewerConfig) {
    'use strict';

    QUnit.module('previewerConfig');

    QUnit.test('module', function(assert) {
        var config = {
            serviceCallId: 'foo'
        };

        assert.expect(3);
        assert.equal(typeof previewerConfig, 'function', 'The previewerConfig module exposes a function');
        assert.equal(typeof previewerConfig(config), 'object', 'The previewerConfig factory produces an instance');
        assert.notStrictEqual(previewerConfig(config), previewerConfig(config), 'The previewerConfig factory provides a different instance on each call');
    });

    QUnit
        .cases.init([
            {title: 'getParameters'},
            {title: 'getServiceCallId'},
            {title: 'getServiceController'},
            {title: 'getServiceExtension'},
            {title: 'getTestActionUrl'},
            {title: 'getItemActionUrl'},
            {title: 'getTimeout'},
            {title: 'getCommunicationConfig'}
        ])
        .test('proxy API ', function(data, assert) {
            var instance = previewerConfig({
                serviceCallId: 'foo'
            });

            assert.expect(1);

            assert.equal(typeof instance[data.title], 'function', 'The previewerConfig instances expose a "' + data.title + '" function');
        });

    QUnit.test('previewerConfig factory', function(assert) {
        assert.expect(1);

        previewerConfig({
            serviceCallId: 'foo'
        });
        assert.ok(true, 'The previewerConfig() factory must not throw an exception when all the required config entries are provided');
    });

    QUnit
        .cases.init([{
            title: 'No item identifier',
            config: {
                serviceCallId: 'http://tao.rdf/1234#56789'
            },
            expected: {
                serviceCallId: 'http://tao.rdf/1234#56789'
            }
        }, {
            title: 'Standard item identifier',
            config: {
                serviceCallId: 'http://tao.rdf/1234#56789'
            },
            itemId: 'http://tao.rdf/item#123',
            expected: {
                serviceCallId: 'http://tao.rdf/1234#56789',
                itemUri: 'http://tao.rdf/item#123'
            }
        }, {
            title: 'Structured item identifier',
            config: {
                serviceCallId: 'http://tao.rdf/1234#56789'
            },
            itemId: {
                resultId: 'http://tao.rdf/result#123',
                itemDefinition: 'http://tao.rdf/item#123',
                deliveryUri: 'http://tao.rdf/delivery#123'
            },
            expected: {
                serviceCallId: 'http://tao.rdf/1234#56789',
                resultId: 'http://tao.rdf/result#123',
                itemDefinition: 'http://tao.rdf/item#123',
                deliveryUri: 'http://tao.rdf/delivery#123'
            }
        }])
        .test('previewerConfig.getParameters', function(data, assert) {
            var instance = previewerConfig(data.config);

            assert.expect(1);

            assert.deepEqual(instance.getParameters(data.itemId), data.expected, 'The previewerConfig.getParameters() method has returned the expected value');
        });

    QUnit
        .cases.init([
            {title: 'number', itemId: 10},
            {title: 'boolean', itemId: true},
            {title: 'array', itemId: [1, 2, 3]}
        ])
        .test('previewerConfig.getParameters#error', function(data, assert) {
            var expectedServiceCallId = 'http://tao.rdf/1234#56789';
            var config = {
                serviceCallId: expectedServiceCallId
            };
            var instance = previewerConfig(config);

            assert.expect(1);

            assert.throws(function() {
                instance.getParameters(data.itemId);
            }, 'The previewerConfig.getParameters() method should throw an error if the parameter does not have the right type');
        });

    QUnit.test('previewerConfig.getServiceCallId', function(assert) {
        var expectedServiceCallId = 'http://tao.rdf/1234#56789';
        var config = {
            serviceCallId: expectedServiceCallId
        };
        var instance = previewerConfig(config);

        assert.expect(1);

        assert.equal(instance.getServiceCallId(), expectedServiceCallId, 'The previewerConfig.getServiceCallId() method has returned the expected value');
    });

    QUnit.test('previewerConfig.getServiceController', function(assert) {
        var expectedServiceController = 'MockRunner';
        var config = {
            serviceCallId: 'foo'
        };
        var instance = previewerConfig(config);

        assert.expect(3);

        assert.notEqual(instance.getServiceController(), expectedServiceController, 'The previewerConfig.getServiceController() method must return the default value');
        assert.ok(!!instance.getServiceController(), 'The previewerConfig.getServiceController() method must not return a null value');

        config.bootstrap = {
            serviceController: expectedServiceController
        };
        instance = previewerConfig(config);
        assert.equal(instance.getServiceController(), expectedServiceController, 'The previewerConfig.getServiceController() method has returned the expected value');
    });

    QUnit.test('previewerConfig.getServiceExtension', function(assert) {
        var expectedServiceExtension = 'MockExtension';
        var config = {
            serviceCallId: 'foo'
        };
        var instance = previewerConfig(config);

        assert.expect(3);

        assert.notEqual(instance.getServiceExtension(), expectedServiceExtension, 'The previewerConfig.getServiceExtension() method must return the default value');
        assert.ok(!!instance.getServiceExtension(), 'The previewerConfig.getServiceExtension() method must not return a null value');

        config.bootstrap = {
            serviceExtension: expectedServiceExtension
        };
        instance = previewerConfig(config);
        assert.equal(instance.getServiceExtension(), expectedServiceExtension, 'The previewerConfig.getServiceExtension() method has returned the expected value');
    });

    QUnit.test('previewerConfig.getTestActionUrl', function(assert) {
        var config = {
            serviceCallId: 'foo',
            bootstrap: {
                serviceController: 'MockRunner',
                serviceExtension: 'MockExtension'
            }
        };
        var expectedUrl = urlUtil.route('action1', config.bootstrap.serviceController, config.bootstrap.serviceExtension, {
            serviceCallId: config.serviceCallId
        });
        var expectedUrl2 = urlUtil.route('action2', config.bootstrap.serviceController, config.bootstrap.serviceExtension, {
            serviceCallId: config.serviceCallId
        });
        var instance = previewerConfig(config);

        assert.expect(2);

        assert.equal(instance.getTestActionUrl('action1'), expectedUrl, 'The previewerConfig.getTestActionUrl() method has returned the expected value');
        assert.equal(instance.getTestActionUrl('action2'), expectedUrl2, 'The previewerConfig.getTestActionUrl() method has returned the expected value');
    });

    QUnit.test('previewerConfig.getItemActionUrl', function(assert) {
        var config = {
            serviceCallId: 'foo',
            bootstrap: {
                serviceController: 'MockRunner',
                serviceExtension: 'MockExtension'
            }
        };
        var actionName = 'MockAction';
        var expectedUrl = urlUtil.route(actionName, config.bootstrap.serviceController, config.bootstrap.serviceExtension, {
            serviceCallId: config.serviceCallId,
            itemUri: 'item1'
        });
        var expectedUrl2 = urlUtil.route(actionName, config.bootstrap.serviceController, config.bootstrap.serviceExtension, {
            serviceCallId: config.serviceCallId,
            itemUri: 'item2'
        });
        var instance = previewerConfig(config);

        assert.expect(2);

        assert.equal(instance.getItemActionUrl('item1', actionName), expectedUrl, 'The previewerConfig.getItemActionUrl() method has returned the expected value');
        assert.equal(instance.getItemActionUrl('item2', actionName), expectedUrl2, 'The previewerConfig.getItemActionUrl() method has returned the expected value');
    });

    QUnit.test('previewerConfig.getTimeout', function(assert) {
        var config = {
            serviceCallId: 'foo'
        };
        var instance = previewerConfig(config);

        assert.expect(2);

        assert.equal(typeof instance.getTimeout(), 'undefined', 'The previewerConfig.getTimeout() method must return an undefined value if no timeout has been set');

        config.timeout = 10;
        instance = previewerConfig(config);
        assert.equal(instance.getTimeout(), 10000, 'The previewerConfig.getTimeout() method has returned the expected value');
    });

    QUnit.test('previewerConfig.getCommunicationConfig', function(assert) {
        var config = {
            serviceCallId: 'http://tao.dev/mockServiceCallId#123',
            bootstrap: {
                serviceController: 'MockRunner',
                serviceExtension: 'MockExtension'
            }
        };
        var expected = {
            enabled: undefined,
            type: undefined,
            params: {
                service: urlUtil.route(
                    'message',
                    config.bootstrap.serviceController,
                    config.bootstrap.serviceExtension,
                    {
                        serviceCallId: config.serviceCallId
                    }
                ),
                timeout: undefined
            },
            syncActions: []
        };
        var instance = previewerConfig(config);

        assert.expect(3);

        assert.deepEqual(
            instance.getCommunicationConfig(),
            expected,
            'The previewerConfig.getCommunicationConfig() method has returned the default values'
        );

        config.timeout = 10;
        config.bootstrap.communication = {
            controller: 'CommunicationRunner',
            extension: 'CommunicationExtension',
            action: 'message',
            syncActions: ['move', 'skip'],
            service: 'http://my.service.tao/1234',
            enabled: true,
            type: 'foo',
            params: {
                interval: 20
            }
        };
        expected.enabled = true;
        expected.type = 'foo';
        expected.syncActions = config.bootstrap.communication.syncActions;
        expected.params = {
            service: config.bootstrap.communication.service,
            timeout: 10000,
            interval: 20000
        };
        instance = previewerConfig(config);
        assert.deepEqual(
            instance.getCommunicationConfig(),
            expected,
            'The previewerConfig.getCommunicationConfig() method has returned the expected values'
        );

        config.bootstrap.communication.params.timeout = 5;
        expected.params.timeout = 5000;

        instance = previewerConfig(config);
        assert.deepEqual(
            instance.getCommunicationConfig(),
            expected,
            'The previewerConfig.getCommunicationConfig() method has returned the expected values'
        );
    });
});
