#include <pebble.h>
#include <stdlib.h>

/*
  Fixed AppMessage key layout.

  These #ifndef blocks allow the app to compile even if CloudPebble does not
  generate MESSAGE_KEY_* constants from the PebbleKit JS Message Keys screen.

  They must match appinfo.json/appKeys and index.js FALLBACK_KEYS.
*/

#ifndef MESSAGE_KEY_OpenhabServer
#define MESSAGE_KEY_OpenhabServer 0
#endif

#ifndef MESSAGE_KEY_OpenhabPort
#define MESSAGE_KEY_OpenhabPort 1
#endif

#ifndef MESSAGE_KEY_ItemTitle1
#define MESSAGE_KEY_ItemTitle1 2
#endif

#ifndef MESSAGE_KEY_ItemName1
#define MESSAGE_KEY_ItemName1 3
#endif

#ifndef MESSAGE_KEY_ItemTitle2
#define MESSAGE_KEY_ItemTitle2 4
#endif

#ifndef MESSAGE_KEY_ItemName2
#define MESSAGE_KEY_ItemName2 5
#endif

#ifndef MESSAGE_KEY_ItemTitle3
#define MESSAGE_KEY_ItemTitle3 6
#endif

#ifndef MESSAGE_KEY_ItemName3
#define MESSAGE_KEY_ItemName3 7
#endif

#ifndef MESSAGE_KEY_ItemTitle4
#define MESSAGE_KEY_ItemTitle4 8
#endif

#ifndef MESSAGE_KEY_ItemName4
#define MESSAGE_KEY_ItemName4 9
#endif

#ifndef MESSAGE_KEY_ItemTitle5
#define MESSAGE_KEY_ItemTitle5 10
#endif

#ifndef MESSAGE_KEY_ItemName5
#define MESSAGE_KEY_ItemName5 11
#endif

#ifndef MESSAGE_KEY_ItemTitle6
#define MESSAGE_KEY_ItemTitle6 12
#endif

#ifndef MESSAGE_KEY_ItemName6
#define MESSAGE_KEY_ItemName6 13
#endif

#ifndef MESSAGE_KEY_ItemTitle7
#define MESSAGE_KEY_ItemTitle7 14
#endif

#ifndef MESSAGE_KEY_ItemName7
#define MESSAGE_KEY_ItemName7 15
#endif

#ifndef MESSAGE_KEY_ItemTitle8
#define MESSAGE_KEY_ItemTitle8 16
#endif

#ifndef MESSAGE_KEY_ItemName8
#define MESSAGE_KEY_ItemName8 17
#endif

#ifndef MESSAGE_KEY_ItemTitle9
#define MESSAGE_KEY_ItemTitle9 18
#endif

#ifndef MESSAGE_KEY_ItemName9
#define MESSAGE_KEY_ItemName9 19
#endif

#ifndef MESSAGE_KEY_ItemTitle10
#define MESSAGE_KEY_ItemTitle10 20
#endif

#ifndef MESSAGE_KEY_ItemName10
#define MESSAGE_KEY_ItemName10 21
#endif

#ifndef MESSAGE_KEY_ItemCount
#define MESSAGE_KEY_ItemCount 22
#endif

#ifndef MESSAGE_KEY_CommandIndex
#define MESSAGE_KEY_CommandIndex 23
#endif

#ifndef MESSAGE_KEY_CommandValue
#define MESSAGE_KEY_CommandValue 24
#endif

#ifndef MESSAGE_KEY_Status
#define MESSAGE_KEY_Status 25
#endif

#ifndef MESSAGE_KEY_StateIndex
#define MESSAGE_KEY_StateIndex 26
#endif

#ifndef MESSAGE_KEY_StateValue
#define MESSAGE_KEY_StateValue 27
#endif

#define MAX_ITEMS 10
#define TITLE_LEN 32
#define ITEM_LEN  48

typedef struct {
  char title[TITLE_LEN];
  char item_name[ITEM_LEN];
  bool state;
  bool enabled;
} OpenhabItem;

static Window *s_main_window;
static MenuLayer *s_menu_layer;
static TextLayer *s_status_layer;

static OpenhabItem s_items[MAX_ITEMS];

static char s_openhab_server[64] = "192.168.1.69";
static char s_openhab_port[8] = "8080";
static int s_item_count = 4;

static char s_status_buffer[64];

static int s_pending_item_index = -1;
static bool s_pending_previous_state = false;

static void set_status(const char *text) {
  snprintf(s_status_buffer, sizeof(s_status_buffer), "%s", text);
  text_layer_set_text(s_status_layer, s_status_buffer);
}

static void default_settings(void) {
  snprintf(s_openhab_server, sizeof(s_openhab_server), "%s", "192.168.1.69");
  snprintf(s_openhab_port, sizeof(s_openhab_port), "%s", "8080");

  s_item_count = 4;

  snprintf(s_items[0].title, TITLE_LEN, "%s", "Bedroom Light");
  snprintf(s_items[0].item_name, ITEM_LEN, "%s", "bedroom_light");
  s_items[0].state = false;
  s_items[0].enabled = true;

  snprintf(s_items[1].title, TITLE_LEN, "%s", "Light 1");
  snprintf(s_items[1].item_name, ITEM_LEN, "%s", "lightrelay1");
  s_items[1].state = false;
  s_items[1].enabled = true;

  snprintf(s_items[2].title, TITLE_LEN, "%s", "Light 2");
  snprintf(s_items[2].item_name, ITEM_LEN, "%s", "lightrelay2");
  s_items[2].state = false;
  s_items[2].enabled = true;

  snprintf(s_items[3].title, TITLE_LEN, "%s", "Spare");
  snprintf(s_items[3].item_name, ITEM_LEN, "%s", "spareitem");
  s_items[3].state = false;
  s_items[3].enabled = true;

  for (int i = 4; i < MAX_ITEMS; i++) {
    s_items[i].title[0] = '\0';
    s_items[i].item_name[0] = '\0';
    s_items[i].state = false;
    s_items[i].enabled = false;
  }
}

static int tuple_to_int(Tuple *tuple, int default_value) {
  if (!tuple) {
    return default_value;
  }

  if (tuple->type == TUPLE_CSTRING) {
    return atoi(tuple->value->cstring);
  }

  return (int)tuple->value->int32;
}

static void update_string_from_tuple(Tuple *tuple, char *destination, size_t destination_size) {
  if (!tuple || !destination || destination_size == 0) {
    return;
  }

  if (tuple->type == TUPLE_CSTRING) {
    snprintf(destination, destination_size, "%s", tuple->value->cstring);
  }
}

static void refresh_enabled_items(void) {
  if (s_item_count < 1) {
    s_item_count = 1;
  }

  if (s_item_count > MAX_ITEMS) {
    s_item_count = MAX_ITEMS;
  }

  for (int i = 0; i < MAX_ITEMS; i++) {
    s_items[i].enabled =
      i < s_item_count &&
      strlen(s_items[i].title) > 0 &&
      strlen(s_items[i].item_name) > 0;
  }
}

static uint16_t get_enabled_count(void) {
  uint16_t count = 0;

  for (int i = 0; i < MAX_ITEMS; i++) {
    if (s_items[i].enabled) {
      count++;
    }
  }

  return count;
}

static int get_real_index_from_menu_index(int menu_index) {
  int visible_index = 0;

  for (int i = 0; i < MAX_ITEMS; i++) {
    if (s_items[i].enabled) {
      if (visible_index == menu_index) {
        return i;
      }

      visible_index++;
    }
  }

  return -1;
}

static void send_openhab_command(int item_index) {
  if (item_index < 0 || item_index >= MAX_ITEMS) {
    return;
  }

  if (s_pending_item_index >= 0) {
    set_status("Busy...");
    vibes_short_pulse();
    return;
  }

  s_pending_item_index = item_index;
  s_pending_previous_state = s_items[item_index].state;

  s_items[item_index].state = !s_items[item_index].state;

  DictionaryIterator *iter;
  AppMessageResult result = app_message_outbox_begin(&iter);

  if (result != APP_MSG_OK) {
    s_items[item_index].state = s_pending_previous_state;
    s_pending_item_index = -1;
    set_status("Outbox failed");
    menu_layer_reload_data(s_menu_layer);
    return;
  }

  dict_write_int32(iter, MESSAGE_KEY_CommandIndex, item_index);

  int32_t command_value = s_items[item_index].state ? 1 : 0;
  dict_write_int32(iter, MESSAGE_KEY_CommandValue, command_value);

  dict_write_end(iter);

  result = app_message_outbox_send();

  if (result == APP_MSG_OK) {
    snprintf(
      s_status_buffer,
      sizeof(s_status_buffer),
      "%s -> %s",
      s_items[item_index].title,
      s_items[item_index].state ? "ON" : "OFF"
    );

    text_layer_set_text(s_status_layer, s_status_buffer);
  } else {
    s_items[item_index].state = s_pending_previous_state;
    s_pending_item_index = -1;
    set_status("Send failed");
  }

  menu_layer_reload_data(s_menu_layer);
}

static uint16_t menu_get_num_sections_callback(MenuLayer *menu_layer, void *data) {
  return 1;
}

static uint16_t menu_get_num_rows_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  return get_enabled_count();
}

static int16_t menu_get_header_height_callback(MenuLayer *menu_layer, uint16_t section_index, void *data) {
  return MENU_CELL_BASIC_HEADER_HEIGHT;
}

static void menu_draw_header_callback(GContext *ctx, const Layer *cell_layer, uint16_t section_index, void *data) {
  menu_cell_basic_header_draw(ctx, cell_layer, "openHAB Controls");
}

static void menu_draw_row_callback(
  GContext *ctx,
  const Layer *cell_layer,
  MenuIndex *cell_index,
  void *data
) {
  int real_index = get_real_index_from_menu_index(cell_index->row);

  if (real_index < 0) {
    return;
  }

  const char *state_text = s_items[real_index].state ? "ON" : "OFF";

  if (s_pending_item_index == real_index) {
    state_text = s_items[real_index].state ? "Sending ON..." : "Sending OFF...";
  }

  menu_cell_basic_draw(
    ctx,
    cell_layer,
    s_items[real_index].title,
    state_text,
    NULL
  );
}

static void menu_select_callback(MenuLayer *menu_layer, MenuIndex *cell_index, void *data) {
  int real_index = get_real_index_from_menu_index(cell_index->row);

  if (real_index >= 0) {
    send_openhab_command(real_index);
  }
}

static void handle_status_message(DictionaryIterator *iterator) {
  Tuple *status_tuple = dict_find(iterator, MESSAGE_KEY_Status);

  if (!status_tuple) {
    return;
  }

  int status = tuple_to_int(status_tuple, 0);

  if (status == 1) {
    set_status("openHAB command OK");
    vibes_short_pulse();
    s_pending_item_index = -1;
  } else {
    if (s_pending_item_index >= 0 && s_pending_item_index < MAX_ITEMS) {
      s_items[s_pending_item_index].state = s_pending_previous_state;
    }

    s_pending_item_index = -1;

    set_status("openHAB command failed");
    vibes_double_pulse();
    menu_layer_reload_data(s_menu_layer);
  }
}

static bool handle_state_message(DictionaryIterator *iterator) {
  Tuple *state_index_tuple = dict_find(iterator, MESSAGE_KEY_StateIndex);
  Tuple *state_value_tuple = dict_find(iterator, MESSAGE_KEY_StateValue);

  if (!state_index_tuple || !state_value_tuple) {
    return false;
  }

  int state_index = tuple_to_int(state_index_tuple, -1);
  int state_value = tuple_to_int(state_value_tuple, 0);

  if (state_index >= 0 && state_index < MAX_ITEMS) {
    s_items[state_index].state = state_value == 1;

    if (s_pending_item_index == state_index) {
      s_pending_item_index = -1;
    }

    menu_layer_reload_data(s_menu_layer);

    snprintf(
      s_status_buffer,
      sizeof(s_status_buffer),
      "%s is %s",
      s_items[state_index].title,
      s_items[state_index].state ? "ON" : "OFF"
    );

    text_layer_set_text(s_status_layer, s_status_buffer);
  }

  return true;
}

static void inbox_received_callback(DictionaryIterator *iterator, void *context) {
  Tuple *status_tuple = dict_find(iterator, MESSAGE_KEY_Status);

  if (status_tuple) {
    handle_status_message(iterator);
    return;
  }

  if (handle_state_message(iterator)) {
    return;
  }

  update_string_from_tuple(
    dict_find(iterator, MESSAGE_KEY_OpenhabServer),
    s_openhab_server,
    sizeof(s_openhab_server)
  );

  update_string_from_tuple(
    dict_find(iterator, MESSAGE_KEY_OpenhabPort),
    s_openhab_port,
    sizeof(s_openhab_port)
  );

  Tuple *item_count_tuple = dict_find(iterator, MESSAGE_KEY_ItemCount);

  if (item_count_tuple) {
    s_item_count = tuple_to_int(item_count_tuple, s_item_count);
  }

  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemTitle1), s_items[0].title, TITLE_LEN);
  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemName1),  s_items[0].item_name, ITEM_LEN);

  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemTitle2), s_items[1].title, TITLE_LEN);
  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemName2),  s_items[1].item_name, ITEM_LEN);

  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemTitle3), s_items[2].title, TITLE_LEN);
  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemName3),  s_items[2].item_name, ITEM_LEN);

  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemTitle4), s_items[3].title, TITLE_LEN);
  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemName4),  s_items[3].item_name, ITEM_LEN);

  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemTitle5), s_items[4].title, TITLE_LEN);
  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemName5),  s_items[4].item_name, ITEM_LEN);

  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemTitle6), s_items[5].title, TITLE_LEN);
  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemName6),  s_items[5].item_name, ITEM_LEN);

  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemTitle7), s_items[6].title, TITLE_LEN);
  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemName7),  s_items[6].item_name, ITEM_LEN);

  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemTitle8), s_items[7].title, TITLE_LEN);
  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemName8),  s_items[7].item_name, ITEM_LEN);

  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemTitle9), s_items[8].title, TITLE_LEN);
  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemName9),  s_items[8].item_name, ITEM_LEN);

  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemTitle10), s_items[9].title, TITLE_LEN);
  update_string_from_tuple(dict_find(iterator, MESSAGE_KEY_ItemName10),  s_items[9].item_name, ITEM_LEN);

  refresh_enabled_items();

  s_pending_item_index = -1;

  menu_layer_reload_data(s_menu_layer);
  set_status("Settings updated");
}

static void inbox_dropped_callback(AppMessageResult reason, void *context) {
  set_status("Inbox dropped");
}

static void outbox_failed_callback(DictionaryIterator *iterator, AppMessageResult reason, void *context) {
  if (s_pending_item_index >= 0 && s_pending_item_index < MAX_ITEMS) {
    s_items[s_pending_item_index].state = s_pending_previous_state;
    s_pending_item_index = -1;
    menu_layer_reload_data(s_menu_layer);
  }

  set_status("Outbox failed");
}

static void outbox_sent_callback(DictionaryIterator *iterator, void *context) {
}

static void main_window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  GRect menu_frame = GRect(0, 0, bounds.size.w, bounds.size.h - 24);

  s_menu_layer = menu_layer_create(menu_frame);
  menu_layer_set_click_config_onto_window(s_menu_layer, window);

  menu_layer_set_callbacks(s_menu_layer, NULL, (MenuLayerCallbacks) {
    .get_num_sections = menu_get_num_sections_callback,
    .get_num_rows = menu_get_num_rows_callback,
    .get_header_height = menu_get_header_height_callback,
    .draw_header = menu_draw_header_callback,
    .draw_row = menu_draw_row_callback,
    .select_click = menu_select_callback
  });

  layer_add_child(window_layer, menu_layer_get_layer(s_menu_layer));

  s_status_layer = text_layer_create(GRect(0, bounds.size.h - 24, bounds.size.w, 24));
  text_layer_set_background_color(s_status_layer, GColorBlack);
  text_layer_set_text_color(s_status_layer, GColorWhite);
  text_layer_set_font(s_status_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  text_layer_set_text_alignment(s_status_layer, GTextAlignmentCenter);
  text_layer_set_text(s_status_layer, "Ready");

  layer_add_child(window_layer, text_layer_get_layer(s_status_layer));
}

static void main_window_unload(Window *window) {
  menu_layer_destroy(s_menu_layer);
  text_layer_destroy(s_status_layer);
}

static void init(void) {
  default_settings();
  refresh_enabled_items();

  s_main_window = window_create();

  window_set_window_handlers(s_main_window, (WindowHandlers) {
    .load = main_window_load,
    .unload = main_window_unload
  });

  app_message_register_inbox_received(inbox_received_callback);
  app_message_register_inbox_dropped(inbox_dropped_callback);
  app_message_register_outbox_failed(outbox_failed_callback);
  app_message_register_outbox_sent(outbox_sent_callback);

  app_message_open(4096, 4096);

  window_stack_push(s_main_window, true);
}

static void deinit(void) {
  app_message_deregister_callbacks();
  window_destroy(s_main_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}