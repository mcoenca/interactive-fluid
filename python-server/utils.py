def merge_two_dicts(x, y):
    z = x.copy()   # start with x's keys and values
    z.update(y)    # modifies z with y's keys and values & returns None
    return z

def filter_keys(old_dict, your_keys):
  dict_you_want = { your_key: old_dict[your_key] for your_key in your_keys }
  return dict_you_want

def map_on_dict(my_dictionary, f):
  my_dictionary = {k: f(v) for k, v in my_dictionary.iteritems()}
  return my_dictionary
