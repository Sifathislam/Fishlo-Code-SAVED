/* Main js */
(function ($) {
  "use strict";

  // Polyfill dead template functions so they don't throw errors when dependencies are removed
  $.fn.slick = function() { return this; };
  $.fn.owlCarousel = function() { return this; };
  $.fn.zoom = function() { return this; };

  /*  Loader  */
  $(window).on("load", function () {
    $(".sp-loader").fadeOut("slow");
  });

  /*  Aos animation on scroll  */
  AOS.init({
    once: true,
  });

  /*  Custom select  */
  $("select").each(function () {
    var $this = $(this),
      selectOptions = $(this).children("option").length;

    $this.addClass("hide-select");
    $this.wrap('<div class="select"></div>');
    $this.after('<div class="custom-select"></div>');

    var $customSelect = $this.next("div.custom-select");
    $customSelect.text($this.children("option").eq(0).text());

    var $optionlist = $("<ul />", {
      class: "select-options",
    }).insertAfter($customSelect);

    for (var i = 0; i < selectOptions; i++) {
      $("<li />", {
        text: $this.children("option").eq(i).text(),
        rel: $this.children("option").eq(i).val(),
      }).appendTo($optionlist);
    }

    var $optionlistItems = $optionlist.children("li");

    $customSelect.on("click", function (e) {
      e.stopPropagation();
      $("div.custom-select.active")
        .not(this)
        .each(function () {
          $(this).removeClass("active").next("ul.select-options").hide();
        });

      $(this).toggleClass("active").next("ul.select-options").slideToggle();
    });

    $optionlistItems.on("click", function (e) {
      e.stopPropagation();
      $customSelect.text($(this).text()).removeClass("active");
      $this.val($(this).attr("rel"));
      $optionlist.hide();
    });

    $(document).on("click", function () {
      $customSelect.removeClass("active");
      $optionlist.hide();
    });

    /*  Custom select  */
    $(".sp-sidebar-toggle").on("click", function () {
      $(".sp-category-popup").addClass("sp-category-open");
      $(".sp-category-popup-overlay").fadeIn();
      $(".sp-category-close").removeClass("sp-category-close-hide");
    });
    $(".sp-category-popup-overlay, .sp-category-close").on("click", function () {
      $(".sp-category-popup").removeClass("sp-category-open");
      $(".sp-category-popup-overlay").fadeOut();
      $(".sp-category-close").addClass("sp-category-close-hide");
    });
  });

  /*  Mobile menu sidebar JS  */
  $(".sp-toggle-menu").on("click", function () {
    $(".sp-mobile-menu-overlay").fadeIn();
    $(".sp-mobile-menu").addClass("sp-menu-open");
  });

  $(".sp-mobile-menu-overlay, .sp-close-menu").on("click", function () {
    $(".sp-mobile-menu-overlay").fadeOut();
    $(".sp-mobile-menu").removeClass("sp-menu-open");
  });
  function ResponsiveMobilemsMenu() {
    var $msNav = $(".sp-menu-content, .overlay-menu"),
      $msNavSubMenu = $msNav.find(".sub-menu");
    $msNavSubMenu.parent().prepend('<span class="menu-toggle"></span>');

    $msNav.on("click", "li a, .menu-toggle", function (e) {
      var $this = $(this);
      if ($this.attr("href") === "#" || $this.hasClass("menu-toggle")) {
        e.preventDefault();
        if ($this.siblings("ul:visible").length) {
          $this.parent("li").removeClass("active");
          $this.siblings("ul").slideUp();
          $this.parent("li").find("li").removeClass("active");
          $this.parent("li").find("ul:visible").slideUp();
        } else {
          $this.parent("li").addClass("active");
          $this
            .closest("li")
            .siblings("li")
            .removeClass("active")
            .find("li")
            .removeClass("active");
          $this.closest("li").siblings("li").find("ul:visible").slideUp();
          $this.siblings("ul").slideDown();
        }
      }
    });
  }

  ResponsiveMobilemsMenu();

  /*  Stickey headre on scroll &&  Menu Fixed On Scroll Active  */
  var doc = document.documentElement;
  var w = window;

  var ecprevScroll = w.scrollY || doc.scrollTop;
  var eccurScroll;
  var ecdirection = 0;
  var ecprevDirection = 0;
  var ecscroll_top = $(window).scrollTop() + 1;
  var echeader = document.getElementById('sp-main-menu-desk');

  var checkScroll = function () {

    eccurScroll = w.scrollY || doc.scrollTop;
    if (eccurScroll > ecprevScroll) {
      //scrolled up
      ecdirection = 2;
    }
    else if (eccurScroll < ecprevScroll) {
      //scrolled down
      ecdirection = 1;
    }

    if (ecdirection !== ecprevDirection) {
      toggleHeader(ecdirection, eccurScroll);
    }

    ecprevScroll = eccurScroll;
  };

  var toggleHeader = function (ecdirection, eccurScroll) {

    if (ecdirection === 2 && eccurScroll > 180) {
      ecprevDirection = ecdirection;
      $(".sticky-nav").addClass("menu_fixed_up");
    }
    else if (ecdirection === 1) {
      ecprevDirection = ecdirection;
      $(".sticky-nav").addClass("menu_fixed");
      $(".sticky-nav").removeClass("menu_fixed_up");
    }
  };

  $(window).on("scroll", function () {
    // var distance = $('.sticky-header-next-sec').offset().top,
    //   $window = $(window);
    var distance = 50;
    var $window = $(window);
    if ($window.scrollTop() <= distance + 120) {
      $(".sticky-nav").removeClass("menu_fixed");
    }
    else {
      checkScroll();
    }
  });

  /*  Cart sidebar JS  */
  $(".sp-cart-toggle").on("click", function (e) {
    e.preventDefault();
    $(".sp-side-cart-overlay").fadeIn();
    $(".sp-side-cart").addClass("sp-open-cart");
  });
  $(".sp-side-cart-overlay, .sp-cart-close").on("click", function (e) {
    e.preventDefault();
    $(".sp-side-cart-overlay").fadeOut();
    $(".sp-side-cart").removeClass("sp-open-cart");
  });



  /*  Wishlist product remove JS  */
  $(".remove-product").on("click", function () {
    $(this).parents(".sp-product-box").remove();
    var wishlist_product_count = $(".sp-product-box").length;
    if (wishlist_product_count == 0) {
      $('.sp-wishlist-products').html('<span class="sp-wish-page-msg"><p>Your Wishlist is empty!</p><span>');
    }
  });

  /*  Compare product remove JS  */
  $(".remove-product-compare").on("click", function () {
    $(this).parents(".sp-product-box").remove();
    var wishlist_product_count = $(".sp-product-box").length;
    if (wishlist_product_count == 0) {
      $('.sp-compare-products').html('<span class="sp-compare-page-msg"><p>Your Compare List is empty!</p><span>');
    }
  });

  /*== Cart page Apply Coupan Toggle ==*/
  $(function () {
    $(".sp-cart-coupan").on("click", function () {
      $('.sp-cart-coupan-content').slideToggle('slow');
    });
    $(".sp-checkout-coupan").on("click", function () {
      $('.sp-checkout-coupan-content').slideToggle('slow');
    });
  });

  /*== Remove Product (Cart page) ==*/
  $('.sp-cart-pro-remove a').on("click", function () {
    $(this).parents(".sp-cart-product").remove();
    var cart_page_count = $(".sp-cart-product").length;
    if (cart_page_count == 0) {
      $('.cart_list').html('<p class="sp-cart-page-msg">Your Cart is empty!</p>');
    }
  });

  /*  Product Weight select JS  */
  $(".sp-pro-variation ul li").on("click", function (e) {
    $(".sp-pro-variation ul li").removeClass("active");
    $(this).addClass("active");
  });

  /*  Product Image Zoom  */
  $('.zoom-image-hover').zoom();

  /*  Single product Slider  */
  $('.single-product-cover').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    fade: false,
    asNavFor: '.single-nav-thumb',
  });

  $('.single-nav-thumb').slick({
    slidesToShow: 4,
    slidesToScroll: 1,
    asNavFor: '.single-product-cover',
    dots: false,
    arrows: true,
    focusOnSelect: true,
    responsive: [
      {
        breakpoint: 1920,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 420,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
    ]
  });

  /* Hero slider */
  $(".sp-hero-slide").owlCarousel({
    margin: 24,
    loop: true,
    dots: false,
    nav: false,
    smartSpeed: 500,
    autoplay: true,
    autoplayTimeout: 5000,
    items: 1,
    responsiveClass: true,
  });

  /*  Galary Single Product Slider  */
  $(".sp-single-slider").owlCarousel({
    margin: 24,
    loop: true,
    dots: false,
    nav: true,
    smartSpeed: 500,
    autoplay: false,
    autoplayTimeout: 5000,
    items: 3,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      421: {
        items: 1,
      },
      768: {
        items: 2,
      },
      1400: {
        items: 3,
      },
    },
  });

  $(".add-more-item").on("click", function (e) {
    e.preventDefault();
    if ($(this).hasClass("sp-active")) {
      $(this).removeClass("sp-active");
    } else {
      $(this).addClass("sp-active");
    }
  });

  /*== Color Hover To Image Change ( Product Card ) ==*/
  var $mnproduct = $('.sp-product-card').find('.sp-opt-swatch');

  function initChangeImg($opt) {
    $opt.each(function () {
      var $this = $(this),
        ecChangeImg = $this.hasClass('sp-change-img');

      $this.on('mouseenter', 'li', function () {
        changeProductImg($(this));
      });

      $this.on('click', 'li', function () {
        changeProductImg($(this));
      });

      function changeProductImg(thisObj) {
        var $this = thisObj;
        var $load = $this.find('a');

        var $proimg = $this.closest('.sp-product-card').find('.sp-pro-img');

        if (!$load.hasClass('loaded')) {
          $proimg.addClass('pro-loading');
        }

        var $loaded = $this.find('a').addClass('loaded');

        $this.addClass('active').siblings().removeClass('active');
        if (ecChangeImg) {
          hoverAddImg($this);
        }
        setTimeout(function () {
          $proimg.removeClass("pro-loading");
        }, 1000);
        return false;
      }

    });
  }

  function hoverAddImg($this) {
    var $optData = $this.find('.sp-opt-clr-img'),
      $opImg = $optData.attr('data-src'),
      $opImgHover = $optData.attr('data-src-hover') || false,
      $optImgWrapper = $this.closest('.sp-product-card').find('.sp-pro-img'),
      $optImgMain = $optImgWrapper.find('.inner-img img.main-img'),
      $optImgMainHover = $optImgWrapper.find('.inner-img img.hover-img');
    if ($opImg.length) {
      $optImgMain.attr('src', $opImg);
    }
    if ($opImg.length) {
      var checkDisable = $optImgMainHover.closest('img.hover-img');
      $optImgMainHover.attr('src', $opImgHover);
      if (checkDisable.hasClass('disable')) {
        checkDisable.removeClass('disable');
      }
    }
    if ($opImgHover === false) {
      $optImgMainHover.closest('img.hover-img').addClass('disable');
    }
  }
  $(window).on('load', function () {
    initChangeImg($mnproduct);
  });
  $(function () {
    initChangeImg($mnproduct);
  });

  /*  Accordians toggle (faq page)  */
  $('.sp-accordion-header').on("click", function () {
    $(this).parent().siblings().children(".sp-accordion-body").slideUp();
    $(this).parent().find(".sp-accordion-body").slideToggle();
  });

  /*  Banners  */
  $(".sp-banner-list").owlCarousel({
    margin: 24,
    loop: true,
    dots: false,
    nav: false,
    smartSpeed: 500,
    merge: true,
    autoplay: false,
    autoplayTimeout: 3000,
    items: 3,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      481: {
        items: 2,
      },
      992: {
        items: 3,
      },
    },
  });

  /*  Category  */
  $(".sp-category-slider").owlCarousel({
    margin: 24,
    loop: true,
    dots: false,
    nav: false,
    smartSpeed: 500,
    autoplay: false,
    autoplayTimeout: 3000,
    items: 8,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      421: {
        items: 2,
      },
      768: {
        items: 3,
      },
      992: {
        items: 4,
      },
      1200: {
        items: 5,
      },
      1400: {
        items: 6,
      },
      1600: {
        items: 8,
      },
    },
  });

  /*  tabs with Slider  */
  $('a[data-bs-toggle="tab"]').on('shown.bs.tab', function (e) {
    // $('.sp-product-slider, .sp-pro-list').hide();
    $('.sp-product-slider, .sp-pro-list').trigger('refresh.owl.carousel');
  });

  /*  Product Slider  */
  $(".sp-product-slider").owlCarousel({
    margin: 24,
    loop: true,
    dots: false,
    nav: false,
    smartSpeed: 500,
    autoplay: false,
    autoplayTimeout: 3000,
    items: 5,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      481: {
        items: 2,
      },
      768: {
        items: 3,
      },
      1200: {
        items: 4,
      },
      1400: {
        items: 5,
      },
    },
  });

  /*  Popular Slider  */
  $(".sp-popular-slider").owlCarousel({
    margin: 24,
    loop: true,
    dots: false,
    nav: true,
    smartSpeed: 500,
    autoplay: false,
    autoplayTimeout: 5000,
    items: 5,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
        nav: false,
      },
      481: {
        items: 2,
        nav: false,
      },
      768: {
        items: 3,
      },
      1200: {
        items: 4,
      },
      1400: {
        items: 5,
      },
    },
  });

  /*  Collection  */
  $(".sp-collection-slider").owlCarousel({
    margin: 24,
    loop: true,
    dots: false,
    nav: false,
    smartSpeed: 500,
    autoplay: false,
    autoplayTimeout: 3000,
    items: 5,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      481: {
        items: 2,
      },
      992: {
        items: 3,
      },
      1200: {
        items: 4,
      },
      1400: {
        items: 5,
      },
    },
  });

  /*  Vendor Section  */
  $(".sp-pro-list").owlCarousel({
    margin: 15,
    loop: true,
    dots: false,
    nav: false,
    smartSpeed: 500,
    autoplay: false,
    autoplayTimeout: 3000,
    items: 5,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
      },
      421: {
        items: 2,
      },
      992: {
        items: 3,
      },
      1200: {
        items: 4,
      },
      1400: {
        items: 5,
      },
    },
  });

  /*  Testimonial Slider  */
  $(".sp-testimonial-slider").owlCarousel({
    margin: 24,
    loop: true,
    dots: false,
    nav: true,
    smartSpeed: 500,
    autoplay: false,
    autoplayTimeout: 5000,
    items: 3,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
        nav: false,
      },
      421: {
        items: 1,
        nav: false,
      },
      768: {
        items: 2,
      },
      1400: {
        items: 3,
      },
    },
  });

  /*  Team (About Page)  */
  $('.sp-team').owlCarousel({
    margin: 30,
    loop: true,
    dots: false,
    nav: true,
    smartSpeed: 1000,
    autoplay: true,
    responsiveClass: true,
    responsive: {
      0: {
        items: 1,
        nav: false,
      },
      461: {
        items: 2,
        nav: false,
      },
      768: {
        items: 3
      },
      992: {
        items: 4
      },
      1200: {
        items: 5
      },
      1400: {
        items: 5
      }
    }
  });

  /*  back-to-top  */
  $(window).scroll(function () {
    if ($(this).scrollTop() > 50) {
      $(".back-to-top").fadeIn();
    } else {
      $(".back-to-top").fadeOut();
    }
  });


  /*  Copyright years JS  */
  var date = new Date().getFullYear();
  // document.getElementById("copyright_year").innerHTML = date;

  /*  Tools Sidebar  */
  $('.sp-tools-sidebar-toggle').on("click", function () {
    $('.sp-tools-sidebar').addClass("open-tools");
    $('.sp-tools-sidebar-overlay').fadeIn();
    $('.sp-tools-sidebar-toggle').hide();

  });
  $('.sp-tools-sidebar-overlay, .close-tools').on("click", function () {
    $('.sp-tools-sidebar').removeClass("open-tools");
    $('.sp-tools-sidebar-overlay').fadeOut();
    $('.sp-tools-sidebar-toggle').fadeIn();
  });

  /*  Dark Light Modes  */
  $(".sp-tools-dark .sp-tools-item").on("click", function () {
    $(".mode-dark").removeClass("active-mode");
    $(this).addClass("active-mode");
  });
  $(".light").on("click", function () {
    $("#add_dark").remove();
  });
  $(".dark").on("click", function () {
    $("head").append(
      '<link rel="stylesheet" href="assets/css/dark.css" id="add_dark">'
    );
  });

  /*  Color show  */
  $(".sp-color li").on("click", function () {
    $("li").removeClass("active-variant");
    $(this).addClass("active-variant");
  });

  $(".color-primary").on("click", function () {
    $("#add_colors").remove();
  });

  $(".color-1").on("click", function () {
    $("#add_colors").remove();
    $("head").append(
      '<link rel="stylesheet" href="assets/css/color-1.css" id="add_colors">'
    );
  });
  $(".color-2").on("click", function () {
    $("#add_colors").remove();
    $("head").append(
      '<link rel="stylesheet" href="assets/css/color-2.css" id="add_colors">'
    );
  });
  $(".color-3").on("click", function () {
    $("#add_colors").remove();
    $("head").append(
      '<link rel="stylesheet" href="assets/css/color-3.css" id="add_colors">'
    );
  });
  $(".color-4").on("click", function () {
    $("#add_colors").remove();
    $("head").append(
      '<link rel="stylesheet" href="assets/css/color-4.css" id="add_colors">'
    );
  });
  $(".color-5").on("click", function () {
    $("#add_colors").remove();
    $("head").append(
      '<link rel="stylesheet" href="assets/css/color-5.css" id="add_colors">'
    );
  });
  $(".color-6").on("click", function () {
    $("#add_colors").remove();
    $("head").append(
      '<link rel="stylesheet" href="assets/css/color-6.css" id="add_colors">'
    );
  });
  $(".color-7").on("click", function () {
    $("#add_colors").remove();
    $("head").append(
      '<link rel="stylesheet" href="assets/css/color-7.css" id="add_colors">'
    );
  });
  $(".color-8").on("click", function () {
    $("#add_colors").remove();
    $("head").append(
      '<link rel="stylesheet" href="assets/css/color-8.css" id="add_colors">'
    );
  });
  $(".color-9").on("click", function () {
    $("#add_colors").remove();
    $("head").append(
      '<link rel="stylesheet" href="assets/css/color-9.css" id="add_colors">'
    );
  });

  /*  RTL-LTR Modes  */
  // Toggle active class between RTL/LTR buttons
  $(".sp-tools-rtl .sp-tools-item").on("click", function () {
    $(".rtl-mode").removeClass("active-mode");
    $(this).addClass("active-mode");
  });

  // Remove RTL stylesheet on LTR click
  $(".ltr").on("click", function () {
    $("#add_rtl").remove();
    $("body").removeClass("rtl");
  });

  // Add RTL stylesheet on RTL click — only if not already added
  $(".rtl").on("click", function () {
    if ($("#add_rtl").length === 0) {
      $("head").append(
        '<link rel="stylesheet" href="assets/css/rtl.css" id="add_rtl">'
      );
    }
    $("body").addClass("rtl");
  });

  /*  Box design  */
  $('.sp-tools-item.box').on("click", function () {
    var boxModes = $(this).attr("data-box-mode-tool");
    $("#box_design").remove();
    if (boxModes == "default") {
      $("#box_design").remove();
    } else if (boxModes == "box-1") {
      $("head").append('<link id="box_design" href="assets/css/box-1.css" rel="stylesheet">');
    } else if (boxModes == "box-2") {
      $("head").append('<link id="box_design" href="assets/css/box-2.css" rel="stylesheet">');
    }
    $(this).parents(".sp-tools-box").find('.sp-tools-item.box').removeClass("active")
    $(this).addClass("active");
  });
})(jQuery);

