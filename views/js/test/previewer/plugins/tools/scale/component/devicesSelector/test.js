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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'core/promise',
    'taoQtiTestPreviewer/previewer/helpers/devices',
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/component/devicesSelector'
], function (
    $,
    _,
    Promise,
    devicesHelper,
    devicesSelectorFactory
) {
    'use strict';

    QUnit.module('Factory');

    QUnit.test('module', function (assert) {
        var instance, instance2;

        assert.expect(3);

        assert.equal(typeof devicesSelectorFactory, 'function', 'The module exposes a function');

        instance = devicesSelectorFactory('#fixture-api');
        assert.equal(typeof instance, 'object', 'The factory produces an object');
        instance.destroy();

        instance = devicesSelectorFactory('#fixture-api');
        instance2 = devicesSelectorFactory('#fixture-api');
        assert.notStrictEqual(instance, instance2, 'The factory provides a different object on each call');
        instance.destroy();
        instance2.destroy();
    });

    QUnit.cases.init([
        {title: 'init'},
        {title: 'destroy'},
        {title: 'render'},
        {title: 'setSize'},
        {title: 'show'},
        {title: 'hide'},
        {title: 'enable'},
        {title: 'disable'},
        {title: 'is'},
        {title: 'setState'},
        {title: 'getContainer'},
        {title: 'getElement'},
        {title: 'getTemplate'},
        {title: 'setTemplate'},
        {title: 'getConfig'}
    ]).test('inherited API ', function (data, assert) {
        var instance = devicesSelectorFactory('#fixture-api');
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', 'The instance exposes a "' + data.title + '" function');
        instance.destroy();
    });

    QUnit.cases.init([
        {title: 'on'},
        {title: 'off'},
        {title: 'trigger'},
        {title: 'spread'}
    ]).test('event API ', function (data, assert) {
        var instance = devicesSelectorFactory('#fixture-api');
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', 'The instance exposes a "' + data.title + '" function');
        instance.destroy();
    });

    QUnit.cases.init([
        {title: 'isDeviceMode'},
        {title: 'updateMode'},
        {title: 'getType'},
        {title: 'getOrientation'},
        {title: 'getDevice'},
        {title: 'getDeviceData'},
        {title: 'setType'},
        {title: 'setOrientation'},
        {title: 'setDevice'},
        {title: 'select'},
        {title: 'reset'}
    ]).test('devicesSelector API ', function (data, assert) {
        var instance = devicesSelectorFactory('#fixture-api');
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', 'The instance exposes a "' + data.title + '" function');
        instance.destroy();
    });

    QUnit.module('Life cycle');

    QUnit.cases.init([{
        title: 'default',
        expected: {
            type: 'standard',
            device: null,
            orientation: null
        }
    }, {
        title: 'unknown type',
        config: {
            type: 'foo',
            device: 'foo',
            orientation: 'foo'
        },
        expected: {
            type: 'standard',
            device: null,
            orientation: null
        }
    }, {
        title: 'desktop, existing device',
        config: {
            type: 'desktop',
            device: 'b7a6dd5900cc72e61f0d3479c7e314ec',
            orientation: null
        },
        expected: {
            type: 'desktop',
            device: 'b7a6dd5900cc72e61f0d3479c7e314ec',
            orientation: null
        }
    }, {
        title: 'desktop, unknown device',
        config: {
            type: 'desktop',
            device: 'foo',
            orientation: 'foo'
        },
        expected: {
            type: 'desktop',
            device: '9e523ae15b61dc766f5c818726881ecf',
            orientation: null
        }
    }, {
        title: 'mobile, existing device',
        config: {
            type: 'mobile',
            device: '9805d9753ad08c7630a9ee5418aa6c6c',
            orientation: 'portrait'
        },
        expected: {
            type: 'mobile',
            device: '9805d9753ad08c7630a9ee5418aa6c6c',
            orientation: 'portrait'
        }
    }, {
        title: 'mobile, unknown device',
        config: {
            type: 'mobile',
            device: 'foo',
            orientation: 'foo'
        },
        expected: {
            type: 'mobile',
            device: '193986c3715c81838870f908fa98d69a',
            orientation: 'landscape'
        }
    }]).test('init', function (data, assert) {
        var ready = assert.async();
        var $container = $('#fixture-init');
        var instance = devicesSelectorFactory($container, data.config);

        assert.expect(4);

        instance
            .after('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getType(), data.expected.type, 'The type is initialized');
                assert.equal(this.getDevice(), data.expected.device, 'The device is initialized');
                assert.equal(this.getOrientation(), data.expected.orientation, 'The orientation is initialized');
            })
            .on('ready', function () {
                this.destroy();
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('render', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-render');
        var instance;

        assert.expect(9);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = devicesSelectorFactory($container);
        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.children().is('.devices-selector'), true, 'The container contains the expected element');

                assert.equal($container.find('.devices-selector').attr('data-type'), 'standard', 'The component contains the device type as an attribute');

                assert.equal($container.find('.type-selector select').length, 1, 'The component contains an area for the list of types');
                assert.equal($container.find('.desktop-selector select').length, 1, 'The component contains an area for the list of desktop devices');
                assert.equal($container.find('.mobile-selector select').length, 1, 'The component contains an area for the list of mobile devices');
                assert.equal($container.find('.orientation-selector select').length, 1, 'The component contains an area for the list of orientations');

                this.destroy();
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('destroy', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-destroy');
        var instance;

        assert.expect(4);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = devicesSelectorFactory($container);
        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');
                this.destroy();
            })
            .after('destroy', function () {
                assert.equal($container.children().length, 0, 'The container is now empty');
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.module('API');

    QUnit.test('device type', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-type');
        var instance = devicesSelectorFactory($container);

        assert.expect(57);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal(this.getType(), 'standard', 'The type is initialized');
                assert.equal(this.getDevice(), null, 'The device is initialized');
                assert.equal(this.getOrientation(), null, 'The orientation is initialized');
                assert.equal(this.isDeviceMode(), false, 'This is not a device mode');

                assert.equal($container.find('.type-selector select:visible').length, 1, 'The types selector is visible');
                assert.equal($container.find('.desktop-selector select:visible').length, 0, 'The desktop devices selector is not visible');
                assert.equal($container.find('.mobile-selector select:visible').length, 0, 'The mobile devices selector is not visible');
                assert.equal($container.find('.orientation-selector select:visible').length, 0, 'The orientation selector is not visible');
                assert.equal($container.find('.devices-selector').attr('data-type'), 'standard', 'The device type set as an attribute');

                assert.equal(this.setType('desktop'), this, 'The type setter is fluent');

                assert.equal(this.getType(), 'desktop', 'The type is changed to desktop');
                assert.equal(this.getDevice(), '9e523ae15b61dc766f5c818726881ecf', 'The device is set');
                assert.equal(this.getOrientation(), null, 'The orientation is not used here');
                assert.equal(this.isDeviceMode(), true, 'This is a device mode');

                assert.equal($container.find('.type-selector select:visible').length, 1, 'The types selector is visible');
                assert.equal($container.find('.desktop-selector select:visible').length, 1, 'The desktop devices selector is visible');
                assert.equal($container.find('.mobile-selector select:visible').length, 0, 'The mobile devices selector is not visible');
                assert.equal($container.find('.orientation-selector select:visible').length, 0, 'The orientation selector is not visible');
                assert.equal($container.find('.devices-selector').attr('data-type'), 'desktop', 'The device type set as an attribute');

                this.setDevice('43193b0ff671a37d8232ab664190a125');
                assert.equal(this.getDevice(), '43193b0ff671a37d8232ab664190a125', 'The device is changed');

                this.setType('mobile');
                assert.equal(this.getType(), 'mobile', 'The type is changed to mobile');
                assert.equal(this.getDevice(), '193986c3715c81838870f908fa98d69a', 'The device is updated');
                assert.equal(this.getOrientation(), 'landscape', 'The orientation has been set');
                assert.equal(this.isDeviceMode(), true, 'This is a device mode');

                assert.equal($container.find('.type-selector select:visible').length, 1, 'The types selector is visible');
                assert.equal($container.find('.desktop-selector select:visible').length, 0, 'The desktop devices selector is not visible');
                assert.equal($container.find('.mobile-selector select:visible').length, 1, 'The mobile devices selector is visible');
                assert.equal($container.find('.orientation-selector select:visible').length, 1, 'The orientation selector is visible');
                assert.equal($container.find('.devices-selector').attr('data-type'), 'mobile', 'The device type set as an attribute');

                this.setType('standard');
                assert.equal(this.getType(), 'standard', 'The type is set to standard');
                assert.equal(this.getDevice(), null, 'The device is voided');
                assert.equal(this.getOrientation(), null, 'The orientation is voided');
                assert.equal(this.isDeviceMode(), false, 'This is not a device mode');

                assert.equal($container.find('.type-selector select:visible').length, 1, 'The types selector is visible');
                assert.equal($container.find('.desktop-selector select:visible').length, 0, 'The desktop devices selector is not visible');
                assert.equal($container.find('.mobile-selector select:visible').length, 0, 'The mobile devices selector is not visible');
                assert.equal($container.find('.orientation-selector select:visible').length, 0, 'The orientation selector is not visible');
                assert.equal($container.find('.devices-selector').attr('data-type'), 'standard', 'The device type set as an attribute');

                this.setType('desktop');
                assert.equal(this.getType(), 'desktop', 'The type is changed again to desktop');
                assert.equal(this.getDevice(), '43193b0ff671a37d8232ab664190a125', 'The desktop device is restored');
                assert.equal(this.getOrientation(), null, 'The orientation is not used here');
                assert.equal(this.isDeviceMode(), true, 'This is a device mode');

                assert.equal($container.find('.type-selector select:visible').length, 1, 'The types selector is visible');
                assert.equal($container.find('.desktop-selector select:visible').length, 1, 'The desktop devices selector is visible');
                assert.equal($container.find('.mobile-selector select:visible').length, 0, 'The mobile devices selector is not visible');
                assert.equal($container.find('.orientation-selector select:visible').length, 0, 'The orientation selector is not visible');
                assert.equal($container.find('.devices-selector').attr('data-type'), 'desktop', 'The device type set as an attribute');

                this.setType('mobile');
                assert.equal(this.getType(), 'mobile', 'The type is changed again to mobile');
                assert.equal(this.getDevice(), '193986c3715c81838870f908fa98d69a', 'The mobile device is restored');
                assert.equal(this.getOrientation(), 'landscape', 'The orientation has been restored');
                assert.equal(this.isDeviceMode(), true, 'This is a device mode');

                assert.equal($container.find('.type-selector select:visible').length, 1, 'The types selector is visible');
                assert.equal($container.find('.desktop-selector select:visible').length, 0, 'The desktop devices selector is not visible');
                assert.equal($container.find('.mobile-selector select:visible').length, 1, 'The mobile devices selector is visible');
                assert.equal($container.find('.orientation-selector select:visible').length, 1, 'The orientation selector is visible');
                assert.equal($container.find('.devices-selector').attr('data-type'), 'mobile', 'The device type set as an attribute');

                this.destroy();
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('device', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-device');
        var instance = devicesSelectorFactory($container);
        var mobileDevices = devicesHelper.getMobileDevices();
        var desktopDevices = devicesHelper.getDesktopDevices();

        assert.expect(34);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal(this.getType(), 'standard', 'The type is initialized');
                assert.equal(this.getDevice(), null, 'The device is initialized');
                assert.equal(this.getOrientation(), null, 'The orientation is initialized');
                assert.deepEqual(this.getDeviceData(), null, 'The device data are initialized');

                this.setType('desktop');
                assert.equal(this.getType(), 'desktop', 'The type is changed to desktop');
                assert.equal(this.getDevice(), '9e523ae15b61dc766f5c818726881ecf', 'The device is set');
                assert.equal(this.getOrientation(), null, 'The orientation is not used here');
                assert.deepEqual(this.getDeviceData(), _.find(desktopDevices, {value: '9e523ae15b61dc766f5c818726881ecf'}), 'The device data are returned');

                assert.equal(this.setDevice('43193b0ff671a37d8232ab664190a125'), this, 'The device setter is fluent');
                assert.equal(this.getDevice(), '43193b0ff671a37d8232ab664190a125', 'The desktop device is changed');
                assert.deepEqual(this.getDeviceData(), _.find(desktopDevices, {value: '43193b0ff671a37d8232ab664190a125'}), 'The device data are returned');

                this.setType('standard');
                assert.equal(this.getType(), 'standard', 'The type is set to standard');
                assert.equal(this.getDevice(), null, 'The device is voided');
                assert.equal(this.getOrientation(), null, 'The orientation is voided');
                assert.deepEqual(this.getDeviceData(), null, 'No device data for the standard mode');

                this.setType('desktop');
                assert.equal(this.getType(), 'desktop', 'The type is set back to desktop');
                assert.equal(this.getDevice(), '43193b0ff671a37d8232ab664190a125', 'The device is restored');
                assert.equal(this.getOrientation(), null, 'The orientation is not used here');
                assert.deepEqual(this.getDeviceData(), _.find(desktopDevices, {value: '43193b0ff671a37d8232ab664190a125'}), 'The device data are returned');

                this.setType('mobile');
                assert.equal(this.getType(), 'mobile', 'The type is changed to mobile');
                assert.equal(this.getDevice(), '193986c3715c81838870f908fa98d69a', 'The device is updated');
                assert.equal(this.getOrientation(), 'landscape', 'The orientation has been set');
                assert.deepEqual(this.getDeviceData(), _.find(mobileDevices, {value: '193986c3715c81838870f908fa98d69a'}), 'The device data are returned');

                this.setDevice('9805d9753ad08c7630a9ee5418aa6c6c');
                assert.equal(this.getDevice(), '9805d9753ad08c7630a9ee5418aa6c6c', 'The mobile device is changed');
                assert.deepEqual(this.getDeviceData(), _.find(mobileDevices, {value: '9805d9753ad08c7630a9ee5418aa6c6c'}), 'The device data are returned');

                this.setType('standard');
                assert.equal(this.getType(), 'standard', 'The type is set to standard');
                assert.equal(this.getDevice(), null, 'The device is voided');
                assert.equal(this.getOrientation(), null, 'The orientation is voided');
                assert.deepEqual(this.getDeviceData(), null, 'No device data for the standard mode');

                this.setType('mobile');
                assert.equal(this.getType(), 'mobile', 'The type is changed again to mobile');
                assert.equal(this.getDevice(), '9805d9753ad08c7630a9ee5418aa6c6c', 'The mobile device is restored');
                assert.equal(this.getOrientation(), 'landscape', 'The orientation has been restored');
                assert.deepEqual(this.getDeviceData(), _.find(mobileDevices, {value: '9805d9753ad08c7630a9ee5418aa6c6c'}), 'The device data are returned');

                this.destroy();
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('orientation', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-orientation');
        var instance = devicesSelectorFactory($container);

        assert.expect(25);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal(this.getType(), 'standard', 'The type is initialized');
                assert.equal(this.getDevice(), null, 'The device is initialized');
                assert.equal(this.getOrientation(), null, 'The orientation is initialized');

                this.setType('mobile');
                assert.equal(this.getType(), 'mobile', 'The type is changed to mobile');
                assert.equal(this.getDevice(), '193986c3715c81838870f908fa98d69a', 'The device is updated');
                assert.equal(this.getOrientation(), 'landscape', 'The orientation has been set');

                this.setType('desktop');
                assert.equal(this.getType(), 'desktop', 'The type is changed to desktop');
                assert.equal(this.getDevice(), '9e523ae15b61dc766f5c818726881ecf', 'The device is set');
                assert.equal(this.getOrientation(), null, 'The orientation is not used here');

                assert.equal(this.setOrientation('portrait'), this, 'The orientation setter is fluent');
                assert.equal(this.getOrientation(), null, 'The orientation is still null');

                this.setType('mobile');
                assert.equal(this.getType(), 'mobile', 'The type is changed to mobile');
                assert.equal(this.getDevice(), '193986c3715c81838870f908fa98d69a', 'The device is updated');
                assert.equal(this.getOrientation(), 'portrait', 'The orientation has been restored');

                this.setOrientation('landscape');
                assert.equal(this.getOrientation(), 'landscape', 'The orientation has been changed');

                this.setType('standard');
                assert.equal(this.getType(), 'standard', 'The type is set to standard');
                assert.equal(this.getDevice(), null, 'The device is voided');
                assert.equal(this.getOrientation(), null, 'The orientation is voided');

                this.setType('desktop');
                assert.equal(this.getType(), 'desktop', 'The type is set back to desktop');
                assert.equal(this.getDevice(), '9e523ae15b61dc766f5c818726881ecf', 'The device is restored');
                assert.equal(this.getOrientation(), null, 'The orientation is not used here');

                this.setType('mobile');
                assert.equal(this.getType(), 'mobile', 'The type is changed to mobile');
                assert.equal(this.getDevice(), '193986c3715c81838870f908fa98d69a', 'The device is updated');
                assert.equal(this.getOrientation(), 'landscape', 'The orientation has been restored');

                this.destroy();
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.cases.init([{
        title: 'default',
        expected: {
            type: 'standard',
            device: null,
            orientation: null
        }
    }, {
        title: 'desktop',
        config: {
            type: 'desktop',
            device: '43193b0ff671a37d8232ab664190a125',
            orientation: 'portrait'
        },
        expected: {
            type: 'desktop',
            device: '43193b0ff671a37d8232ab664190a125',
            orientation: null
        }
    }, {
        title: 'mobile',
        config: {
            type: 'mobile',
            device: '9805d9753ad08c7630a9ee5418aa6c6c',
            orientation: 'portrait'
        },
        expected: {
            type: 'mobile',
            device: '9805d9753ad08c7630a9ee5418aa6c6c',
            orientation: 'portrait'
        }
    }]).test('reset', function (data, assert) {
        var ready = assert.async();
        var $container = $('#fixture-reset');
        var instance = devicesSelectorFactory($container, data.config);

        assert.expect(11);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal(this.getType(), data.expected.type, 'The type is initialized');
                assert.equal(this.getDevice(), data.expected.device, 'The device is initialized');
                assert.equal(this.getOrientation(), data.expected.orientation, 'The orientation is initialized');

                this.setType('mobile');
                this.setDevice('193986c3715c81838870f908fa98d69a');
                this.setOrientation('landscape');
                assert.equal(this.getType(), 'mobile', 'The type is changed to mobile');
                assert.equal(this.getDevice(), '193986c3715c81838870f908fa98d69a', 'The device is updated');
                assert.equal(this.getOrientation(), 'landscape', 'The orientation has been set');

                assert.equal(this.reset(), this, 'The reset method is fluent');

                assert.equal(this.getType(), data.expected.type, 'The type is reset');
                assert.equal(this.getDevice(), data.expected.device, 'The device is reset');
                assert.equal(this.getOrientation(), data.expected.orientation, 'The orientation is reset');

                this.destroy();
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.cases.init([{
        title: 'type',
        type: 'type',
        value: 'desktop',
        config: {
            type: 'standard',
            device: null,
            orientation: null
        },
        expected: {
            type: 'desktop',
            device: '9e523ae15b61dc766f5c818726881ecf',
            orientation: null
        }
    }, {
        title: 'device',
        type: 'device',
        value: '43193b0ff671a37d8232ab664190a125',
        config: {
            type: 'desktop',
            device: '9e523ae15b61dc766f5c818726881ecf',
            orientation: null
        },
        expected: {
            type: 'desktop',
            device: '43193b0ff671a37d8232ab664190a125',
            orientation: null
        }
    }, {
        title: 'desktop',
        type: 'desktop',
        value: '43193b0ff671a37d8232ab664190a125',
        config: {
            type: 'desktop',
            device: '9e523ae15b61dc766f5c818726881ecf',
            orientation: null
        },
        expected: {
            type: 'desktop',
            device: '43193b0ff671a37d8232ab664190a125',
            orientation: null
        }
    }, {
        title: 'mobile',
        type: 'mobile',
        value: '9805d9753ad08c7630a9ee5418aa6c6c',
        config: {
            type: 'mobile',
            device: '193986c3715c81838870f908fa98d69a',
            orientation: 'landscape'
        },
        expected: {
            type: 'mobile',
            device: '9805d9753ad08c7630a9ee5418aa6c6c',
            orientation: 'landscape'
        }
    }, {
        title: 'orientation',
        type: 'orientation',
        value: 'portrait',
        config: {
            type: 'mobile',
            device: '193986c3715c81838870f908fa98d69a',
            orientation: 'landscape'
        },
        expected: {
            type: 'mobile',
            device: '193986c3715c81838870f908fa98d69a',
            orientation: 'portrait'
        }
    }]).test('select', function (data, assert) {
        var ready = assert.async();
        var $container = $('#fixture-select');
        var instance = devicesSelectorFactory($container, data.config);

        assert.expect(8);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal(this.getType(), data.config.type, 'The type is initialized');
                assert.equal(this.getDevice(), data.config.device, 'The device is initialized');
                assert.equal(this.getOrientation(), data.config.orientation, 'The orientation is initialized');

                assert.equal(this.select(data.type, data.value), this, 'The setter  is fluent');

                assert.equal(this.getType(), data.expected.type, 'The type is set as expected');
                assert.equal(this.getDevice(), data.expected.device, 'The device is set as expected');
                assert.equal(this.getOrientation(), data.expected.orientation, 'The orientation is set as expected');

                this.destroy();
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('event', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-event');
        var instance = devicesSelectorFactory($container);

        assert.expect(24);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                Promise.resolve()
                    .then(function() {
                        assert.equal(instance.getType(), 'standard', 'The type is initialized');
                        assert.equal(instance.getDevice(), null, 'The device is initialized');
                        assert.equal(instance.getOrientation(), null, 'The orientation is initialized');
                    })
                    .then(function() {
                        return Promise.all([
                            new Promise(function(resolve) {
                                instance.on('typechange.test', function(type) {
                                    assert.equal(type, 'desktop', 'The type should be changed to desktop');
                                    assert.equal(instance.getType(), 'desktop', 'The type has been changed to desktop');
                                    resolve();
                                });
                            }),
                            new Promise(function(resolve) {
                                instance.on('devicechange.test', function(device, data) {
                                    assert.equal(device, '9e523ae15b61dc766f5c818726881ecf', 'The device should be changed to 9e523ae15b61dc766f5c818726881ecf');
                                    assert.equal(instance.getDevice(), '9e523ae15b61dc766f5c818726881ecf', 'The device has been changed to 9e523ae15b61dc766f5c818726881ecf');
                                    assert.equal(typeof data, 'object', 'The data is provided');
                                    assert.equal(data, instance.getDeviceData(), 'The expected data is provided');
                                    resolve();
                                });
                            }),
                            new Promise(function(resolve) {
                                instance.setType('desktop');
                                resolve();
                            })
                        ]);
                    })
                    .then(function() {
                        instance.off('.test');
                        return new Promise(function(resolve) {
                            instance
                                .on('devicechange.test', function(device, data) {
                                    assert.equal(device, '43193b0ff671a37d8232ab664190a125', 'The device should be changed to 43193b0ff671a37d8232ab664190a125');
                                    assert.equal(instance.getDevice(), '43193b0ff671a37d8232ab664190a125', 'The device has been changed to 43193b0ff671a37d8232ab664190a125');
                                    assert.equal(typeof data, 'object', 'The data is provided');
                                    assert.equal(data, instance.getDeviceData(), 'The expected data is provided');
                                    resolve();
                                })
                                .setDevice('43193b0ff671a37d8232ab664190a125');
                        });
                    })
                    .then(function() {
                        instance.off('.test');
                        return new Promise(function(resolve) {
                            instance
                                .on('typechange.test', function (type) {
                                    assert.equal(type, 'standard', 'The type should be changed to standard');
                                    assert.equal(instance.getType(), 'standard', 'The type has been changed to standard');
                                    resolve();
                                })
                                .on('devicechange.test', function () {
                                    assert.ok(false, 'The device should not be changed');
                                })
                                .setType('standard');
                        });
                    })
                    .then(function() {
                        instance.off('.test');
                        return Promise.all([
                            new Promise(function(resolve) {
                                instance.on('typechange.test', function(type) {
                                    assert.equal(type, 'mobile', 'The type should be changed to mobile');
                                    assert.equal(instance.getType(), 'mobile', 'The type has been changed to mobile');
                                    resolve();
                                });
                            }),
                            new Promise(function(resolve) {
                                instance.on('devicechange.test', function(device, data) {
                                    assert.equal(device, '193986c3715c81838870f908fa98d69a', 'The device should be changed to 193986c3715c81838870f908fa98d69a');
                                    assert.equal(instance.getDevice(), '193986c3715c81838870f908fa98d69a', 'The device has been changed to 193986c3715c81838870f908fa98d69a');
                                    assert.equal(typeof data, 'object', 'The data is provided');
                                    assert.equal(data, instance.getDeviceData(), 'The expected data is provided');
                                    resolve();
                                });
                            }),
                            new Promise(function(resolve) {
                                instance.setType('mobile');
                                resolve();
                            })
                        ]);
                    })
                    .then(function() {
                        instance.off('.test');
                        return new Promise(function(resolve) {
                            instance
                                .on('orientationchange.test', function(orientation) {
                                    assert.equal(orientation, 'portrait', 'The orientation should be changed to portrait');
                                    assert.equal(instance.getOrientation(), 'portrait', 'The orientation has been changed to portrait');
                                    resolve();
                                })
                                .setOrientation('portrait');
                        });
                    })
                    .then(function() {
                        instance.off('.test');
                        instance.destroy();
                    })
                    .catch(function(err) {
                        assert.ok(false, 'The operation should not fail!');
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                        instance.destroy();
                    });
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.test('user event', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-userevent');
        var instance = devicesSelectorFactory($container);

        assert.expect(24);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                Promise.resolve()
                    .then(function() {
                        assert.equal(instance.getType(), 'standard', 'The type is initialized');
                        assert.equal(instance.getDevice(), null, 'The device is initialized');
                        assert.equal(instance.getOrientation(), null, 'The orientation is initialized');
                    })
                    .then(function() {
                        return Promise.all([
                            new Promise(function(resolve) {
                                instance.on('typechange.test', function(type) {
                                    assert.equal(type, 'desktop', 'The type should be changed to desktop');
                                    assert.equal(instance.getType(), 'desktop', 'The type has been changed to desktop');
                                    resolve();
                                });
                            }),
                            new Promise(function(resolve) {
                                instance.on('devicechange.test', function(device, data) {
                                    assert.equal(device, '9e523ae15b61dc766f5c818726881ecf', 'The device should be changed to 9e523ae15b61dc766f5c818726881ecf');
                                    assert.equal(instance.getDevice(), '9e523ae15b61dc766f5c818726881ecf', 'The device has been changed to 9e523ae15b61dc766f5c818726881ecf');
                                    assert.equal(typeof data, 'object', 'The data is provided');
                                    assert.equal(data, instance.getDeviceData(), 'The expected data is provided');
                                    resolve();
                                });
                            }),
                            new Promise(function(resolve) {
                                instance.getElement().find('.type-selector select').val('desktop').trigger('change');
                                resolve();
                            })
                        ]);
                    })
                    .then(function() {
                        instance.off('.test');
                        return new Promise(function(resolve) {
                            instance.on('devicechange.test', function(device, data) {
                                assert.equal(device, '43193b0ff671a37d8232ab664190a125', 'The device should be changed to 43193b0ff671a37d8232ab664190a125');
                                assert.equal(instance.getDevice(), '43193b0ff671a37d8232ab664190a125', 'The device has been changed to 43193b0ff671a37d8232ab664190a125');
                                assert.equal(typeof data, 'object', 'The data is provided');
                                assert.equal(data, instance.getDeviceData(), 'The expected data is provided');
                                resolve();
                            });
                            instance.getElement().find('.desktop-selector select').val('43193b0ff671a37d8232ab664190a125').trigger('change');
                        });
                    })
                    .then(function() {
                        instance.off('.test');
                        return new Promise(function(resolve) {
                            instance
                                .on('typechange.test', function (type) {
                                    assert.equal(type, 'standard', 'The type should be changed to standard');
                                    assert.equal(instance.getType(), 'standard', 'The type has been changed to standard');
                                    resolve();
                                })
                                .on('devicechange.test', function () {
                                    assert.ok(false, 'The device should not be changed');
                                });
                            instance.getElement().find('.type-selector select').val('standard').trigger('change');
                        });
                    })
                    .then(function() {
                        instance.off('.test');
                        return Promise.all([
                            new Promise(function(resolve) {
                                instance.on('typechange.test', function(type) {
                                    assert.equal(type, 'mobile', 'The type should be changed to mobile');
                                    assert.equal(instance.getType(), 'mobile', 'The type has been changed to mobile');
                                    resolve();
                                });
                            }),
                            new Promise(function(resolve) {
                                instance.on('devicechange.test', function(device, data) {
                                    assert.equal(device, '193986c3715c81838870f908fa98d69a', 'The device should be changed to 193986c3715c81838870f908fa98d69a');
                                    assert.equal(instance.getDevice(), '193986c3715c81838870f908fa98d69a', 'The device has been changed to 193986c3715c81838870f908fa98d69a');
                                    assert.equal(typeof data, 'object', 'The data is provided');
                                    assert.equal(data, instance.getDeviceData(), 'The expected data is provided');
                                    resolve();
                                });
                            }),
                            new Promise(function(resolve) {
                                instance.getElement().find('.type-selector select').val('mobile').trigger('change');
                                resolve();
                            })
                        ]);
                    })
                    .then(function() {
                        instance.off('.test');
                        return new Promise(function(resolve) {
                            instance.on('orientationchange.test', function(orientation) {
                                assert.equal(orientation, 'portrait', 'The orientation should be changed to portrait');
                                assert.equal(instance.getOrientation(), 'portrait', 'The orientation has been changed to portrait');
                                resolve();
                            });
                            instance.getElement().find('.orientation-selector select').val('portrait').trigger('change');
                        });
                    })
                    .then(function() {
                        instance.off('.test');
                        instance.destroy();
                    })
                    .catch(function(err) {
                        assert.ok(false, 'The operation should not fail!');
                        assert.pushResult({
                            result: false,
                            message: err
                        });
                        instance.destroy();
                    });
            })
            .on('destroy', function () {
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });

    QUnit.module('Visual');

    QUnit.test('Visual test', function (assert) {
        var ready = assert.async();
        var $container = $('#visual-test');
        var instance = devicesSelectorFactory($container);

        assert.expect(3);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');
                ready();
            })
            .on('error', function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });
});
