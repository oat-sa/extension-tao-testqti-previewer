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
    'ui/transformer',
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/component/devicesPreviewer',
    'taoQtiTestPreviewer/previewer/plugins/tools/scale/component/devicesSelector',
    'tpl!taoQtiTestPreviewer/test/previewer/plugins/tools/scale/component/devicesPreviewer/mock'
], function (
    $,
    _,
    Promise,
    transformer,
    devicesPreviewerFactory,
    devicesSelectorFactory,
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
        {title: 'isDeviceMode'},
        {title: 'getDeviceType'},
        {title: 'setDeviceType'},
        {title: 'previewDevice'},
        {title: 'clearScale'},
        {title: 'applyScale'},
        {title: 'getFrameMargins'},
        {title: 'getFrameSize'},
        {title: 'getScaleFactor'},
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

        assert.expect(7);

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
                assert.equal($container.find('.devices-previewer .preview-frame').length, 1, 'The preview frame is there');
                assert.equal($container.find('.devices-previewer .preview-content').length, 1, 'The preview content container is there');

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

    QUnit.test('show', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-show');
        var instance;

        assert.expect(12);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = devicesPreviewerFactory($container);
        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                var $mock = $(mockTpl());
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.children().is('.devices-previewer'), true, 'The container contains the expected element');
                assert.equal($container.find('.devices-previewer .preview-content').length, 1, 'The preview container is there');

                this.wrap($mock);
                assert.equal($container.find('.devices-previewer .preview-content .preview-content-mock').length, 1, 'The preview container contains the mock');

                assert.equal($container.find('.devices-previewer .preview-content').is(':visible'), true, 'The preview container is visible');
                assert.equal($mock.is(':visible'), true, 'The content is visible');
                instance.hide();

                assert.equal($container.find('.devices-previewer .preview-content').is(':visible'), false, 'The preview container is hidden');
                assert.equal($mock.is(':visible'), false, 'The content is hidden');
                instance.show();

                assert.equal($container.find('.devices-previewer .preview-content').is(':visible'), true, 'The preview container is visible again');
                assert.equal($mock.is(':visible'), true, 'The content is visible');

                instance.destroy();
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

    QUnit.test('enable', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-enable');
        var instance;

        assert.expect(16);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = devicesPreviewerFactory($container);
        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                var $mock = $(mockTpl());
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.children().is('.devices-previewer'), true, 'The container contains the expected element');
                assert.equal($container.find('.devices-previewer .preview-content').length, 1, 'The preview container is there');

                assert.equal(this.is('disabled'), false, 'The element is enabled');
                assert.equal($container.find('.devices-previewer.disabled').length, 0, 'The DOM element is enabled');

                this.wrap($mock);
                assert.equal($container.find('.devices-previewer .preview-content .preview-content-mock').length, 1, 'The preview container contains the mock');

                Promise.resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('scalechange.test', function () {
                                    assert.ok(true, 'Scaling applied');
                                })
                                .on('devicepreview.test', function () {
                                    assert.ok(true, 'Preview updated');
                                    resolve();
                                })
                                .setDeviceType('desktop')
                                .setDeviceWidth(1920)
                                .setDeviceHeight(1080)
                                .previewDevice();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('scalechange.test', function () {
                                    assert.ok(false, 'Scaling should not be applied');
                                })
                                .on('scaleclear.test', function () {
                                    assert.ok(true, 'Scaling removed');
                                })
                                .on('devicepreview.test', function () {
                                    assert.equal(instance.is('disabled'), true, 'The element is disabled');
                                    assert.equal($container.find('.devices-previewer.disabled').length, 1, 'The DOM element is disabled');
                                    resolve();
                                })
                                .disable();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('scalechange.test', function () {
                                    assert.ok(true, 'Scaling has been applied');
                                })
                                .on('scaleclear.test', function () {
                                    assert.ok(false, 'Scaling should not be removed');
                                })
                                .on('devicepreview.test', function () {
                                    assert.equal(instance.is('disabled'), false, 'The element is enabled again');
                                    assert.equal($container.find('.devices-previewer.disabled').length, 0, 'The DOM element is enabled again');
                                    resolve();
                                })
                                .enable();
                        });
                    })
                    .then(function () {
                        instance
                            .off('.test')
                            .destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'The operation should not fail!');
                        assert.pushResult({
                            result: false,
                            message: err
                        });
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

    QUnit.test('destroy', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-destroy');
        var instance;

        assert.expect(12);

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
                assert.equal($container.find('.devices-previewer .preview-frame').length, 1, 'The preview frame is there');
                assert.equal($container.find('.devices-previewer .preview-content').length, 1, 'The preview content container is there');
                this.destroy();
            })
            .after('destroy', function () {
                assert.equal($container.children().length, 0, 'The container is now empty');
                assert.equal($container.find('.devices-previewer').length, 0, 'The preview component is removed');
                assert.equal($container.find('.preview-container').length, 0, 'The preview container is removed');
                assert.equal($container.find('.preview-frame').length, 0, 'The preview frame is removed');
                assert.equal($container.find('.preview-content').length, 0, 'The preview content container is removed');
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
        var expected = 'mobile';

        assert.expect(9);

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
                assert.equal(this.isDeviceMode(), false, 'This is not a device mode');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'standard', 'The type is not set on the DOM');
                assert.equal(instance.setDeviceType(expected), instance, 'The device type setter is fluent');
            })
            .on('done', function () {
                assert.equal(instance.getDeviceType(), expected, 'The device type has been set');
                assert.equal(this.isDeviceMode(), true, 'This is a device mode');
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
        var fullSize = {
            width: 800,
            height: 600
        };

        assert.expect(33);
        $container
            .width(fullSize.width)
            .height(fullSize.height);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.find('.devices-previewer .preview-container').length, 1, 'The preview container is there');
                assert.equal($container.find('.devices-previewer .preview-frame').length, 1, 'The preview frame is there');
                assert.equal($container.find('.devices-previewer .preview-content').length, 1, 'The preview content container is there');

                Promise.resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('scalechange.test', function () {
                                    assert.ok(false, 'Scaling should not be applied');
                                })
                                .on('scaleclear.test', function () {
                                    assert.ok(true, 'Scaling removed');
                                })
                                .on('devicepreview.test', function () {
                                    assert.equal($container.find('.devices-previewer').attr('data-type'), 'standard', 'The preview should be in standard mode');
                                    assert.equal(typeof $container.find('.devices-previewer .preview-content').attr('style'), 'undefined', 'The content has no forced style');
                                    assert.equal(typeof $container.find('.devices-previewer .preview-container').attr('style'), 'undefined', 'The container has no forced style');
                                    resolve();
                                })
                                .previewDevice();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .setDeviceType('desktop')
                                .setDeviceWidth(1920)
                                .setDeviceHeight(1080)
                                .on('scalechange.test', function () {
                                    assert.ok(true, 'Scaling has been applied');
                                })
                                .on('scaleclear.test', function () {
                                    assert.ok(false, 'Scaling should not be removed');
                                })
                                .on('devicepreview.test', function () {
                                    var transformation = transformer.getTransformation($container.find('.devices-previewer .preview-container'));
                                    assert.equal($container.find('.devices-previewer').attr('data-type'), 'desktop', 'The preview should be in desktop mode');
                                    assert.equal($container.find('.devices-previewer .preview-content').width(), 1920, 'The content has the expected width');
                                    assert.equal($container.find('.devices-previewer .preview-content').height(), 1080, 'The content has the expected height');
                                    assert.notEqual(transformation.obj.scaleX, 1, 'The content has the expected X transformation');
                                    assert.notEqual(transformation.obj.scaleY, 1, 'The content has the expected Y transformation');
                                    resolve();
                                })
                                .previewDevice();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .setDeviceType('mobile')
                                .setDeviceOrientation('landscape')
                                .setDeviceWidth(960)
                                .setDeviceHeight(600)
                                .on('scalechange.test', function () {
                                    assert.ok(true, 'Scaling has been applied');
                                })
                                .on('scaleclear.test', function () {
                                    assert.ok(false, 'Scaling should not be removed');
                                })
                                .on('devicepreview.test', function () {
                                    var transformation = transformer.getTransformation($container.find('.devices-previewer .preview-container'));
                                    assert.equal($container.find('.devices-previewer').attr('data-type'), 'mobile', 'The preview should be in mobile mode');
                                    assert.equal($container.find('.devices-previewer').attr('data-orientation'), 'landscape', 'The preview should be in landscape mode');
                                    assert.equal($container.find('.devices-previewer .preview-content').width(), 960, 'The content has the expected width');
                                    assert.equal($container.find('.devices-previewer .preview-content').height(), 600, 'The content has the expected height');
                                    assert.notEqual(transformation.obj.scaleX, 1, 'The content has the expected X transformation');
                                    assert.notEqual(transformation.obj.scaleY, 1, 'The content has the expected Y transformation');
                                    resolve();
                                })
                                .previewDevice();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .setDeviceType('mobile')
                                .setDeviceOrientation('portrait')
                                .setDeviceWidth(960)
                                .setDeviceHeight(600)
                                .on('scalechange.test', function () {
                                    assert.ok(true, 'Scaling has been applied');
                                })
                                .on('scaleclear.test', function () {
                                    assert.ok(false, 'Scaling should not be removed');
                                })
                                .on('devicepreview.test', function () {
                                    var transformation = transformer.getTransformation($container.find('.devices-previewer .preview-container'));
                                    assert.equal($container.find('.devices-previewer').attr('data-type'), 'mobile', 'The preview should be in mobile mode');
                                    assert.equal($container.find('.devices-previewer').attr('data-orientation'), 'portrait', 'The preview should be in portrait mode');
                                    assert.equal($container.find('.devices-previewer .preview-content').width(), 600, 'The content has the expected width');
                                    assert.equal($container.find('.devices-previewer .preview-content').height(), 960, 'The content has the expected height');
                                    assert.notEqual(transformation.obj.scaleX, 1, 'The content has the expected X transformation');
                                    assert.notEqual(transformation.obj.scaleY, 1, 'The content has the expected Y transformation');
                                    resolve();
                                })
                                .previewDevice();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('scalechange.test', function () {
                                    assert.ok(false, 'Scaling should not be applied');
                                })
                                .on('scaleclear.test', function () {
                                    assert.ok(true, 'Scaling removed');
                                })
                                .setDeviceType('standard')
                                .on('devicepreview.test', function () {
                                    assert.equal($container.find('.devices-previewer').attr('data-type'), 'standard', 'The preview should be back in standard mode');
                                    assert.equal(typeof $container.find('.devices-previewer .preview-content').attr('style'), 'undefined', 'The content has no forced style anymore');
                                    assert.equal(typeof $container.find('.devices-previewer .preview-container').attr('style'), 'undefined', 'The container has no forced style anymore');
                                    resolve();
                                })
                                .previewDevice();
                        });
                    })
                    .then(function () {
                        instance
                            .off('.test')
                            .destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'The operation should not fail!');
                        assert.pushResult({
                            result: false,
                            message: err
                        });
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

    QUnit.test('margin', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-margin');
        var instance = devicesPreviewerFactory($container);
        var fullSize = {
            width: 800,
            height: 600
        };
        var expected = {
            standard: 0,
            desktop: 70,
            mobile: 90
        };

        assert.expect(15);
        $container
            .width(fullSize.width)
            .height(fullSize.height);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.deepEqual(this.getFrameMargins(), {
                    width: 0,
                    height: 0
                }, 'Not yet rendered');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');

                assert.equal($container.find('.devices-previewer').attr('data-type'), 'standard', 'The preview should be in standard mode');
                assert.deepEqual(this.getFrameMargins(), {
                    width: expected.standard,
                    height: expected.standard
                }, 'Standard device, no margin');

                instance.setDeviceType('desktop');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'desktop', 'The preview should be in desktop mode');
                assert.deepEqual(this.getFrameMargins(), {
                    width: expected.desktop,
                    height: expected.desktop
                }, 'Desktop device, low margin');

                instance.setDeviceType('mobile')
                    .setDeviceOrientation('landscape');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'mobile', 'The preview should be in mobile mode');
                assert.equal($container.find('.devices-previewer').attr('data-orientation'), 'landscape', 'The preview should be in landscape mode');
                assert.deepEqual(this.getFrameMargins(), {
                    width: expected.mobile,
                    height: expected.mobile
                }, 'Mobile device, high margin, landscape');

                instance.setDeviceType('mobile')
                    .setDeviceOrientation('portrait');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'mobile', 'The preview should be in mobile mode');
                assert.equal($container.find('.devices-previewer').attr('data-orientation'), 'portrait', 'The preview should be in portrait mode');
                assert.deepEqual(this.getFrameMargins(), {
                    width: expected.mobile,
                    height: expected.mobile
                }, 'Mobile device, high margin, portrait');

                instance.setDeviceType('standard');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'standard', 'The preview should be back in standard mode');
                assert.deepEqual(this.getFrameMargins(), {
                    width: expected.standard,
                    height: expected.standard
                }, 'Back to standard device, no margin');

                instance.destroy();
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

    QUnit.test('size', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-size');
        var instance = devicesPreviewerFactory($container);
        var fullSize = {
            width: 800,
            height: 600
        };

        assert.expect(15);
        $container
            .width(fullSize.width)
            .height(fullSize.height);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.deepEqual(this.getFrameSize(), {
                    width: 0,
                    height: 0
                }, 'Not yet rendered');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');

                assert.equal($container.find('.devices-previewer').attr('data-type'), 'standard', 'The preview should be in standard mode');
                assert.deepEqual(this.getFrameSize(), fullSize, 'Standard device, full size');

                instance.setDeviceType('desktop');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'desktop', 'The preview should be in desktop mode');
                assert.deepEqual(this.getFrameSize(), fullSize, 'Desktop device');

                instance.setDeviceType('mobile')
                    .setDeviceOrientation('landscape');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'mobile', 'The preview should be in mobile mode');
                assert.equal($container.find('.devices-previewer').attr('data-orientation'), 'landscape', 'The preview should be in landscape mode');
                assert.deepEqual(this.getFrameSize(), fullSize, 'Mobile device, landscape');

                instance.setDeviceType('mobile')
                    .setDeviceOrientation('portrait');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'mobile', 'The preview should be in mobile mode');
                assert.equal($container.find('.devices-previewer').attr('data-orientation'), 'portrait', 'The preview should be in portrait mode');
                assert.deepEqual(this.getFrameSize(), fullSize, 'Mobile device, portrait');

                instance.setDeviceType('standard');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'standard', 'The preview should be back in standard mode');
                assert.deepEqual(this.getFrameSize(), fullSize, 'Back to standard device, full size');

                instance.destroy();
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

    QUnit.test('scale factor', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-scale-factor');
        var instance = devicesPreviewerFactory($container);
        var fullSize = {
            width: 320,
            height: 200
        };

        assert.expect(12);
        $container
            .width(fullSize.width)
            .height(fullSize.height);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
                assert.equal(this.getScaleFactor(1920, 1080), 1, 'Not yet rendered');
            })
            .on('ready', function () {
                assert.equal($container.children().length, 1, 'The container contains an element');

                assert.equal($container.find('.devices-previewer').attr('data-type'), 'standard', 'The preview should be in standard mode');
                assert.equal(this.getScaleFactor(1920, 1200), 1, 'Standard device, no scale factor');

                instance.setDeviceType('desktop');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'desktop', 'The preview should be in desktop mode');
                assert.equal(this.getScaleFactor(1920, 1080), this.getFrameSize().width / (1920 + this.getFrameMargins().width), 'Desktop device');

                instance.setDeviceType('mobile');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'mobile', 'The preview should be in mobile mode');
                assert.equal(this.getScaleFactor(960, 600), this.getFrameSize().height / (600 + this.getFrameMargins().height), 'Mobile device, landscape');
                assert.equal(this.getScaleFactor(600, 960), this.getFrameSize().height / (960 + this.getFrameMargins().height), 'Mobile device, portrait');

                instance.setDeviceType('standard');
                assert.equal($container.find('.devices-previewer').attr('data-type'), 'standard', 'The preview should be back in standard mode');
                assert.equal(this.getScaleFactor(1280, 1024), 1, 'Back to standard device, no scale factor');

                instance.destroy();
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

        assert.expect(14);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                var $mock = $(mockTpl());
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.find('.preview-content-mock').length, 0, 'The container does not contain the mock');
                assert.equal($container.find('.devices-previewer .preview-content').length, 1, 'The preview container is there');
                assert.equal($container.find('.devices-previewer .preview-content').children().length, 0, 'The preview container is empty');

                $container.append($mock);
                assert.equal($container.children().length, 2, 'The container contains 2 elements');
                assert.equal($container.find('.preview-content-mock').length, 1, 'The container now contains the mock');
                assert.equal($container.find('.devices-previewer .preview-content .preview-content-mock').length, 0, 'The preview container is still empty');

                Promise.resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('wrap.test', function ($wrapped) {
                                    assert.equal($wrapped.is($mock), true, 'Received the wrapped element');
                                    assert.equal($container.children().length, 1, 'The container contains only 1 element now');
                                    assert.equal($container.find('.devices-previewer .preview-content .preview-content-mock').length, 1, 'The preview container now contains the mock');
                                    resolve();
                                })
                                .wrap($mock);
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('wrap.test', function ($wrapped) {
                                    assert.equal($wrapped.is($mock), true, 'Received the wrapped element');
                                    assert.equal($container.children().length, 1, 'The container contains only 1 element now');
                                    assert.equal($container.find('.devices-previewer .preview-content .preview-content-mock').length, 1, 'The preview container now contains the mock');
                                    resolve();
                                })
                                .wrap($mock);
                        });
                    })
                    .then(function () {
                        instance
                            .off('.test')
                            .destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'The operation should not fail!');
                        assert.pushResult({
                            result: false,
                            message: err
                        });
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

    QUnit.test('unwrap', function (assert) {
        var ready = assert.async();
        var $container = $('#fixture-unwrap');
        var instance = devicesPreviewerFactory($container);

        assert.expect(18);

        instance
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function () {
                var $mock = $(mockTpl());
                assert.equal($container.children().length, 1, 'The container contains an element');
                assert.equal($container.find('.preview-content-mock').length, 0, 'The container does not contain the mock');
                assert.equal($container.find('.devices-previewer .preview-content').length, 1, 'The preview container is there');
                assert.equal($container.find('.devices-previewer .preview-content').children().length, 0, 'The preview container is empty');

                $container.append($mock);
                assert.equal($container.children().length, 2, 'The container contains 2 elements');
                assert.equal($container.find('.preview-content-mock').length, 1, 'The container now contains the mock');
                assert.equal($container.find('.devices-previewer .preview-content .preview-content-mock').length, 0, 'The preview container is still empty');

                Promise.resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('wrap.test', function ($wrapped) {
                                    assert.equal($wrapped.is($mock), true, 'Received the wrapped element');
                                    assert.equal($container.children().length, 1, 'The container contains only 1 element now');
                                    assert.equal($container.find('.devices-previewer .preview-content .preview-content-mock').length, 1, 'The preview container now contains the mock');
                                    resolve();
                                })
                                .wrap($mock);
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            instance
                                .off('.test')
                                .on('unwrap.test', function ($wrapped) {
                                    assert.equal($wrapped.is($mock), true, 'Received the wrapped element');
                                    assert.equal($container.children().length, 2, 'The container contains again 2 elements');
                                    assert.equal($container.find('.preview-content-mock').length, 1, 'The container now contains again the mock');
                                    assert.equal($container.find('.devices-previewer .preview-content .preview-content-mock').length, 0, 'The preview container is empty again');
                                    resolve();
                                })
                                .unwrap();
                        });
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            var to = _.delay(function () {
                                assert.equal($container.children().length, 2, 'Nothing changed, the container contains 2 elements');
                                assert.equal($container.find('.preview-content-mock').length, 1, 'Nothing changed, the container now contains the mock');
                                assert.equal($container.find('.devices-previewer .preview-content .preview-content-mock').length, 0, 'Nothing changed, the preview container is empty');
                                resolve();
                            }, 250);

                            instance
                                .off('.test')
                                .on('unwrap.test', function () {
                                    clearTimeout(to);
                                    assert.ok('false', 'Should not unwrap again');
                                    resolve();
                                })
                                .unwrap();
                        });
                    })
                    .then(function () {
                        instance
                            .off('.test')
                            .destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'The operation should not fail!');
                        assert.pushResult({
                            result: false,
                            message: err
                        });
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
        var $contentContainer = $('#visual-test .content');
        var $toolbarContainer = $('#visual-test .toolbar');
        var selector = devicesSelectorFactory($toolbarContainer);
        var previewer = devicesPreviewerFactory($contentContainer);

        assert.expect(6);

        assert.equal($toolbarContainer.children().length, 0, 'The toolbar container is empty');
        assert.equal($contentContainer.children().length, 0, 'The content container is empty');

        Promise.all([
            new Promise(function (resolve) {
                selector.on('ready', function () {
                    assert.equal(this, selector, 'The selector has been initialized');
                    assert.equal($toolbarContainer.find('.devices-selector').length, 1, 'The selector has been rendered');
                    resolve();
                });
            }),
            new Promise(function (resolve) {
                previewer.on('ready', function () {
                    assert.equal(this, previewer, 'The previewer has been initialized');
                    assert.equal($contentContainer.find('.devices-previewer').length, 1, 'The previewer has been rendered');
                    resolve();
                });
            })
        ])
            .then(function () {
                previewer
                    .wrap(mockTpl())
                    .previewDevice();

                selector.on('typechange devicechange orientationchange', function () {
                    var size = selector.getDeviceData();
                    previewer.setDeviceType(selector.getType())
                        .setDeviceOrientation(selector.getOrientation())
                        .setDeviceWidth(size && size.width)
                        .setDeviceHeight(size && size.height)
                        .previewDevice();
                });

                $(window).on('resize orientationchange', _.throttle(function () {
                    if (selector.isDeviceMode()) {
                        previewer.previewDevice();
                    }
                }, 50));

                ready();
            })
            .catch(function (err) {
                assert.ok(false, 'The operation should not fail!');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            });
    });
});
