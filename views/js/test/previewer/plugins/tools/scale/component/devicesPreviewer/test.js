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
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/component/devicesPreviewer',
    'tpl!taoQtiTestPreviewer/test/previewer/plugins/tools/scale/component/devicesPreviewer/mock'
], function (
    $,
    _,
    Promise,
    devicesPreviewerFactory,
    mockTpl
) {
    'use strict';

    QUnit.module('Factory');

    QUnit.test('module', function (assert) {
        var instance, instance2;

        assert.expect(3);

        assert.equal(typeof devicesPreviewerFactory, 'function', 'The module exposes a function');

        instance = devicesPreviewerFactory('#fixture-api')
            .on('ready', function () {
                this.destroy();
            });
        assert.equal(typeof instance, 'object', 'The factory produces an object');

        instance = devicesPreviewerFactory('#fixture-api')
            .on('ready', function () {
                this.destroy();
            });
        instance2 = devicesPreviewerFactory('#fixture-api')
            .on('ready', function () {
                this.destroy();
            });
        assert.notStrictEqual(instance, instance2, 'The factory provides a different object on each call');
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
        var instance = devicesPreviewerFactory('#fixture-api')
            .on('ready', function () {
                this.destroy();
            });
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', 'The instance exposes a "' + data.title + '" function');
    });

    QUnit.cases.init([
        {title: 'on'},
        {title: 'off'},
        {title: 'trigger'},
        {title: 'spread'}
    ]).test('event API ', function (data, assert) {
        var instance = devicesPreviewerFactory('#fixture-api')
            .on('ready', function () {
                this.destroy();
            });
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', 'The instance exposes a "' + data.title + '" function');
    });

    QUnit.cases.init([
        {title: 'getDeviceWidth'},
        {title: 'setDeviceWidth'},
        {title: 'getDeviceHeight'},
        {title: 'setDeviceHeight'},
        {title: 'getDeviceOrientation'},
        {title: 'setDeviceOrientation'},
        {title: 'getDeviceType'},
        {title: 'setDeviceType'},
        {title: 'previewDevice'},
        {title: 'wrap'},
        {title: 'unwrap'}
    ]).test('devicesPreviewer API ', function (data, assert) {
        var instance = devicesPreviewerFactory('#fixture-api')
            .on('ready', function () {
                this.destroy();
            });
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', 'The instance exposes a "' + data.title + '" function');
    });

    QUnit.module('Life cycle');

    QUnit.cases.init([{
        title: 'default',
        expected: {
            deviceType: 'standard',
            deviceWidth: 0,
            deviceHeight: 0,
            deviceOrientation: null
        }
    }, {
        title: 'random type',
        config: {
            deviceType: 'foo',
            deviceWidth: 'foo',
            deviceHeight: 'foo',
            deviceOrientation: 'foo'
        },
        expected: {
            deviceType: 'foo',
            deviceWidth: 0,
            deviceHeight: 0,
            deviceOrientation: 'foo'
        }
    }, {
        title: 'desktop',
        config: {
            deviceType: 'desktop',
            deviceWidth: 1920,
            deviceHeight: 1080,
            deviceOrientation: null
        },
        expected: {
            deviceType: 'desktop',
            deviceWidth: 1920,
            deviceHeight: 1080,
            deviceOrientation: null
        }
    }, {
        title: 'mobile',
        config: {
            deviceType: 'mobile',
            deviceWidth: 900,
            deviceHeight: 720,
            deviceOrientation: 'portrait'
        },
        expected: {
            deviceType: 'mobile',
            deviceWidth: 900,
            deviceHeight: 720,
            deviceOrientation: 'portrait'
        }
    }]).test('init', function (data, assert) {
        var ready = assert.async();
        var $container = $('#fixture-init');
        var instance = devicesPreviewerFactory($container, data.config);

        assert.expect(5);

        instance
            .after('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');

                assert.equal(this.getDeviceType(), data.expected.deviceType, 'The type is initialized');
                assert.equal(this.getDeviceWidth(), data.expected.deviceWidth, 'The device width is initialized');
                assert.equal(this.getDeviceHeight(), data.expected.deviceHeight, 'The device height is initialized');
                assert.equal(this.getDeviceOrientation(), data.expected.deviceOrientation, 'The orientation is initialized');
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

        assert.expect(5);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = devicesPreviewerFactory($container);
        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.children().is('.devices-previewer'), true, 'The container contains the expected element');
                assert.equal($container.find('.devices-previewer .preview-container').length, 1, 'The preview container is there');

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

        instance = devicesPreviewerFactory($container);
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

    QUnit.test('width', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-width');
        var instance = devicesPreviewerFactory($container);
        var expected = 1920;

        assert.expect(5);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                this.on('devicewidthchange', function (width) {
                    assert.equal(width, expected, 'The devicewidthchange event is triggered');
                    this.trigger('done');
                });

                assert.equal(instance.getDeviceWidth(), 0, 'The device width is initialized');
                assert.equal(instance.setDeviceWidth(expected), instance, 'The device width setter is fluent');
            })
            .on('done', function () {
                assert.equal(instance.getDeviceWidth(), expected, 'The device width has been set');
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

    QUnit.test('height', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-height');
        var instance = devicesPreviewerFactory($container);
        var expected = 1280;

        assert.expect(5);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                this.on('deviceheightchange', function (height) {
                    assert.equal(height, expected, 'The deviceheightchange event is triggered');
                    this.trigger('done');
                });

                assert.equal(instance.getDeviceHeight(), 0, 'The device height is initialized');
                assert.equal(instance.setDeviceHeight(expected), instance, 'The device height setter is fluent');
            })
            .on('done', function () {
                assert.equal(instance.getDeviceHeight(), expected, 'The device height has been set');
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
        var instance = devicesPreviewerFactory($container);
        var expected = 'landscape';

        assert.expect(7);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                this.on('deviceorientationchange', function (height) {
                    assert.equal(height, expected, 'The deviceorientationchange event is triggered');
                    this.trigger('done');
                });

                assert.equal(instance.getDeviceOrientation(), null, 'The device orientation is initialized');
                assert.equal($container.find('.devices-previewer').attr('data-orientation'), '', 'The orientation is not set on the DOM');
                assert.equal(instance.setDeviceOrientation(expected), instance, 'The device orientation setter is fluent');
            })
            .on('done', function () {
                assert.equal(instance.getDeviceOrientation(), expected, 'The device orientation has been set');
                assert.equal($container.find('.devices-previewer').attr('data-orientation'), expected, 'The orientation is set on the DOM');
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

    QUnit.test('type', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-type');
        var instance = devicesPreviewerFactory($container);
        var expected = 'landscape';

        assert.expect(7);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                this.on('devicetypechange', function (height) {
                    assert.equal(height, expected, 'The devicetypechange event is triggered');
                    this.trigger('done');
                });

                assert.equal(instance.getDeviceType(), 'standard', 'The device type is initialized');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'standard', 'The type is not set on the DOM');
                assert.equal(instance.setDeviceType(expected), instance, 'The device type setter is fluent');
            })
            .on('done', function () {
                assert.equal(instance.getDeviceType(), expected, 'The device type has been set');
                assert.equal($container.find('.devices-previewer').attr('data-type'), expected, 'The type is set on the DOM');
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

    QUnit.test('preview', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-preview');
        var instance = devicesPreviewerFactory($container);

        assert.expect(2);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');

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

    QUnit.test('wrap', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-wrap');
        var instance = devicesPreviewerFactory($container);

        assert.expect(12);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                var $mock = $(mockTpl());
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.find('.preview-content-mock').length, 0, 'The container does not contain the mock');
                assert.equal($container.find('.devices-previewer .preview-container').length, 1, 'The preview container is there');
                assert.equal($container.find('.devices-previewer .preview-container').children().length, 0, 'The preview container is empty');

                $container.append($mock);
                assert.equal($container.children().length, 2, 'The container contains 2 elements');
                assert.equal($container.find('.preview-content-mock').length, 1, 'The container now contains the mock');
                assert.equal($container.find('.devices-previewer .preview-container .preview-content-mock').length, 0, 'The preview container is still empty');

                this.wrap($mock);

                assert.equal($container.children().length, 1, 'The container contains only 1 element now');
                assert.equal($container.find('.devices-previewer .preview-container .preview-content-mock').length, 1, 'The preview container now contains the mock');

                this.wrap($mock);

                assert.equal($container.children().length, 1, 'The container contains only 1 element now');
                assert.equal($container.find('.devices-previewer .preview-container .preview-content-mock').length, 1, 'The preview container now contains the mock');

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

    QUnit.test('unwrap', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-unwrap');
        var instance = devicesPreviewerFactory($container);

        assert.expect(16);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                var $mock = $(mockTpl());
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.find('.preview-content-mock').length, 0, 'The container does not contain the mock');
                assert.equal($container.find('.devices-previewer .preview-container').length, 1, 'The preview container is there');
                assert.equal($container.find('.devices-previewer .preview-container').children().length, 0, 'The preview container is empty');

                $container.append($mock);
                assert.equal($container.children().length, 2, 'The container contains 2 elements');
                assert.equal($container.find('.preview-content-mock').length, 1, 'The container now contains the mock');
                assert.equal($container.find('.devices-previewer .preview-container .preview-content-mock').length, 0, 'The preview container is still empty');

                this.wrap($mock);

                assert.equal($container.children().length, 1, 'The container contains only 1 element now');
                assert.equal($container.find('.devices-previewer .preview-container .preview-content-mock').length, 1, 'The preview container now contains the mock');

                this.unwrap();

                assert.equal($container.children().length, 2, 'The container contains again 2 elements');
                assert.equal($container.find('.preview-content-mock').length, 1, 'The container now contains again the mock');
                assert.equal($container.find('.devices-previewer .preview-container .preview-content-mock').length, 0, 'The preview container is empty again');

                this.unwrap();

                assert.equal($container.children().length, 2, 'Nothing changed, the container contains 2 elements');
                assert.equal($container.find('.preview-content-mock').length, 1, 'Nothing changed, the container now contains the mock');
                assert.equal($container.find('.devices-previewer .preview-container .preview-content-mock').length, 0, 'Nothing changed, the preview container is empty');

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

    QUnit.module('Visual');

    QUnit.test('Visual test', function (assert) {
        var ready = assert.async();
        var $container = $('#visual-test');
        var instance = devicesPreviewerFactory($container);

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
